/**
 * useTournament — Single-elimination tournament bracket generator + tracker.
 *
 * Pulls 4 or 8 league peers from the existing league_memberships view (or the
 * `useLiveLeaderboard` 15-row group if the tournament is launched from a
 * specific tier). The current user is always seeded into slot #1 so they're
 * guaranteed to see themselves on the bracket.
 *
 * The match state is local-only for now; we deliberately avoid a
 * `tournament_brackets` table because (a) tournaments are recreational and
 * (b) writing a 4-7 row multiplayer state-machine to Postgres is overkill.
 * When the user "finishes" the tournament we just send a notification +
 * (optionally) bump their weekly XP via RPC.
 *
 * Match outcomes are recorded into gamification point-earners via
 * `trackStudySession` so the streak widget on Dashboard / Achievements
 * reflects participation even if the user lost every round.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchLeagueBoard, type LeagueBoardData } from '../services/gamification/leagueService';
import { trackStudySession } from '../services/gamification/gamificationService';
import { LEAGUE_TIERS } from '../types/league';
import { supabase } from '../services/database/supabase';

export type BracketSize = 4 | 8;

export interface TournamentPlayer {
  id: string;
  name: string;
  /** User tier (1..10). */
  tier: number;
  /** Bot flag — true for synthetic filler when league has < (size-1) members. */
  isBot: boolean;
}

export interface TournamentMatch {
  /** Unique match id (deterministic). */
  id: string;
  /** Slot indexes in `players`. */
  playerA: number;
  playerB: number;
  /** Winner slot index, or null when not yet decided. */
  winner: number | null;
  /** Round number (0 = first round). */
  round: number;
}

export interface TournamentState {
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  /** The slot index that ultimately wins. Computed from `matches`. */
  champion: number | null;
  loading: boolean;
  error: string | null;
  size: BracketSize;
  setSize: (size: BracketSize) => void;
  /** User must call this first — generates players + initial bracket. */
  seed: (size?: BracketSize) => Promise<void>;
  /** Mark a match winner (advances to next round if applicable). */
  declareWinner: (matchId: string, winnerSlot: number) => void;
  reset: () => void;
  /** XP earned from the tournament so far (1 per win, 3 per completed tournament, 0 if lost in R1). */
  earnedXp: number;
}

const BOT_NAMES = [
  'AceBot', 'Brainstormer', 'CardCounter', 'DeepDiver', 'Epoch',
  'FactFinder', 'GeniusArc', 'Hypatia', 'Insighto', 'Judex',
  'Kaleido', 'Lambda', 'Mnemosyne', 'Neuronix', 'OmegaQ',
];

function pseudoRandom(seed: string): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x85ebca6b) >>> 0;
  }
  return h / 0xffffffff;
}

function shuffle<T>(arr: T[], seed: string): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(seed + ':' + i) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBracket(players: TournamentPlayer[], size: BracketSize): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  const firstRoundCount = size / 2;
  // Seed in a way that puts the user (always at index 0) into a fair bracket.
  const seedOrder = shuffle(
    Array.from({ length: size }, (_, i) => i),
    'auramind-bracket-' + Date.now(),
  );
  for (let i = 0; i < firstRoundCount; i++) {
    matches.push({
      id: `m-r0-${i}`,
      playerA: seedOrder[i * 2],
      playerB: seedOrder[i * 2 + 1],
      winner: null,
      round: 0,
    });
  }
  // Round-half-size matchups constructed from winners. We keep them as
  // empty placeholders so the UI can render the visual tree.
  let prevCount = firstRoundCount;
  let round = 1;
  while (prevCount > 1) {
    const nextCount = prevCount / 2;
    for (let i = 0; i < nextCount; i++) {
      matches.push({
        id: `m-r${round}-${i}`,
        playerA: -1,
        playerB: -1,
        winner: null,
        round,
      });
    }
    prevCount = nextCount;
    round += 1;
  }
  return matches;
}

function advanceBracket(matches: TournamentMatch[]): TournamentMatch[] {
  const byRound: Record<number, TournamentMatch[]> = {};
  for (const m of matches) {
    byRound[m.round] = byRound[m.round] || [];
    byRound[m.round].push(m);
  }
  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);
  const updated = matches.slice();
  for (let r = 0; r < rounds.length - 1; r++) {
    const thisRound = byRound[r];
    const nextRound = byRound[r + 1];
    if (!thisRound || !nextRound) continue;
    for (let i = 0; i < thisRound.length; i++) {
      const m = thisRound[i];
      if (m.winner === null) continue;
      const targetIdx = Math.floor(i / 2);
      const target = nextRound[targetIdx];
      if (!target) continue;
      const prop: 'playerA' | 'playerB' = i % 2 === 0 ? 'playerA' : 'playerB';
      const targetMatch = updated.findIndex((x) => x.id === target.id);
      if (targetMatch === -1) continue;
      if (updated[targetMatch][prop] !== m.winner) {
        updated[targetMatch] = { ...updated[targetMatch], [prop]: m.winner };
        updated[targetMatch].winner = null;
      }
    }
  }
  return updated;
}

export function useTournament(): TournamentState {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<BracketSize>(4);

  const seed = useCallback(async (override?: BracketSize) => {
    const targetSize = override ?? size;
    setLoading(true);
    setError(null);
    try {
      const board: LeagueBoardData | null = await fetchLeagueBoard(undefined);
      const tierPeers = board?.groupsThisTier?.[0]?.members ?? [];
      const tier = board?.groupsThisTier?.[0]?.tier ?? 1;
      const me = tierPeers.find((m) => m.isCurrentUser);
      const others = tierPeers.filter((m) => !m.isCurrentUser).slice(0, targetSize - 1);
      const fillerCount = Math.max(0, targetSize - 1 - others.length);

      const generated: TournamentPlayer[] = [];

      // Always seed "me" at slot 0 for visual fairness.
      if (me) {
        generated.push({
          id: me.userId,
          name: me.name,
          tier,
          isBot: false,
        });
      } else {
        // Fallback me-slot. We deliberately do NOT call supabase.auth.getUser()
        // here (it's async and would race against this sync seed); we mint a
        // local id and the local trackStudySession call below will dedupe
        // any double-fires against the same minute.
        generated.push({
          id: 'local-me-' + Date.now(),
          name: 'You',
          tier,
          isBot: false,
        });
      }
      for (const p of others) {
        generated.push({ id: p.userId, name: p.name, tier, isBot: false });
      }
      // Bots fill out the bracket. Different ranks so the bracket has texture.
      // Bot name index uses `generated.length` directly (no Date.now() jitter)
      // so a user who re-sees the same bracket doesn't see name reshuffles.
      for (let i = 0; i < fillerCount; i++) {
        const idx = generated.length;
        generated.push({
          id: `bot-${idx}`,
          name: BOT_NAMES[idx % BOT_NAMES.length],
          tier: Math.max(1, tier - (idx % 2)),
          isBot: true,
        });
      }
      setPlayers(generated);
      setMatches(buildBracket(generated, targetSize));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // Fallback local bracket: me + bots only.
      const fallback: TournamentPlayer[] = [{ id: 'me', name: 'You', tier: 1, isBot: false }];
      for (let i = 0; i < targetSize - 1; i++) {
        fallback.push({
          id: `bot-${i}`,
          name: BOT_NAMES[i % BOT_NAMES.length],
          tier: 1,
          isBot: true,
        });
      }
      setPlayers(fallback);
      setMatches(buildBracket(fallback, targetSize));
    } finally {
      setLoading(false);
    }
  }, [size]);

  const declareWinner = useCallback(
    (matchId: string, winnerSlot: number) => {
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === matchId);
        if (idx === -1) return prev;
        if (prev[idx].winner !== null) return prev; // already set
        const updated = prev.slice();
        updated[idx] = { ...updated[idx], winner: winnerSlot };
        return advanceBracket(updated);
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setMatches([]);
    setPlayers([]);
    setError(null);
  }, []);

  const champion = useMemo<number | null>(() => {
    const final = matches.find((m) => m.round === Math.max(...matches.map((x) => x.round)));
    return final?.winner ?? null;
  }, [matches]);

  // Award XP once per match transition + a final completion bonus. We track
  // decided match count in a ref so the gamification surface only sees a
  // single fire per actual transition (not on every render of an unchanged
  // matches array, which the dep-array would otherwise trigger).
  const lastDecidedCount = useRef(0);
  useEffect(() => {
    if (matches.length === 0) {
      lastDecidedCount.current = 0;
      return;
    }
    const decidedCount = matches.filter((m) => m.winner !== null).length;
    if (decidedCount > lastDecidedCount.current) {
      try {
        trackStudySession(0.1, 25);
      } catch {}
      lastDecidedCount.current = decidedCount;
    }
  }, [matches]);

  // Champion belt: when ALL matches decided, fire a tour-grade completion
  // reward exactly once. The "extra" 5 XP is the celebratory step on top
  // of the per-match bumps above.
  useEffect(() => {
    if (matches.length === 0) return;
    if (!matches.every((m) => m.winner !== null)) return;
    try {
      trackStudySession(0.5, 100);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champion]);

  const earnedXp = matches.filter((m) => m.winner !== null).length;

  return {
    players,
    matches,
    champion,
    loading,
    error,
    size,
    setSize,
    seed,
    declareWinner,
    reset,
    earnedXp,
  };
}
