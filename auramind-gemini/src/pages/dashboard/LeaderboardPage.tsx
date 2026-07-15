import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus, Flame, Zap, BookOpen, Users } from 'lucide-react';
import PageShell from '../../components/dashboard/PageShell';
import { supabase } from '../../services/database/supabase';
import { getUserStats, type UserStats } from '../../services/gamification/gamificationService';

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  title: string;
  streak: number;
  cardsStudied: number;
  decksCreated: number;
  sessionsCompleted: number;
  rank: number;
  previousRank: number;
}

type TimeFilter = 'weekly' | 'monthly' | 'allTime';

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'allTime', label: 'All Time' },
  { key: 'monthly', label: 'This Month' },
  { key: 'weekly', label: 'This Week' },
];

const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice Learner', 2: 'Apprentice Scholar', 3: 'Dedicated Student',
  4: 'Knowledge Seeker', 5: 'Focused Studier', 6: 'Deep Learner',
  7: 'Subject Master', 8: 'Expert Scholar', 9: 'Academic Ace',
  10: 'Legendary Learner', 11: 'Grand Master', 12: 'Supreme Scholar',
  13: 'Ultimate Knowledge', 14: 'Eternal Student', 15: 'Transcendent Sage',
};

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] || 'Learner';
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2: return <Medal className="w-5 h-5 text-slate-300" />;
    case 3: return <Medal className="w-5 h-5 text-amber-600" />;
    default: return <span className="text-sm font-bold text-[#5A5A72] w-5 text-center">{rank}</span>;
  }
}

function getTrendIcon(current: number, previous: number) {
  const diff = previous - current;
  if (diff > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (diff < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-[#5A5A72]" />;
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
  const colors: Record<number, string> = {
    1: 'from-yellow-500 to-amber-600',
    2: 'from-slate-400 to-slate-500',
    3: 'from-amber-600 to-orange-700',
  };
  const glowColors: Record<number, string> = {
    1: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]',
    2: 'shadow-[0_0_20px_rgba(148,163,184,0.25)]',
    3: 'shadow-[0_0_20px_rgba(217,119,6,0.25)]',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[position]} flex items-center justify-center text-white text-lg font-bold ${glowColors[position]}`}>
        {entry.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-xs font-medium text-[#F0EFFE] truncate max-w-[80px] text-center">{entry.name}</p>
      <p className="text-[10px] text-[#5A5A72]">{entry.xp.toLocaleString()} XP</p>
      <div className={`w-full ${heights[position]} bg-gradient-to-b from-[#1A1A24] to-[#111118] border border-[#2A2A3A] rounded-t-xl flex items-center justify-center mt-1`}>
        <span className="text-3xl font-black text-[#F0EFFE]/10">{position}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('allTime');
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all user profiles
      let query = supabase!
        .from('user_profiles')
        .select('user_id, full_name, email, xp, level, streak_days, cards_studied, decks_created, sessions_completed, title')
        .order('xp', { ascending: false })
        .limit(50);

      // Apply time filter if not allTime
      if (filter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('last_study_date', weekAgo);
      } else if (filter === 'monthly') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('last_study_date', monthAgo);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Get current user
      const { data: { session } } = await supabase!.auth.getSession();
      const currentUserId = session?.user?.id;

      // Build entries
      const all: LeaderboardEntry[] = (profiles || []).map((p: any, i: number) => ({
        userId: p.user_id,
        name: p.full_name || p.email?.split('@')[0] || 'Anonymous',
        email: p.email || '',
        xp: p.xp || 0,
        level: p.level || 1,
        title: p.title || getLevelTitle(p.level || 1),
        streak: p.streak_days || 0,
        cardsStudied: p.cards_studied || 0,
        decksCreated: p.decks_created || 0,
        sessionsCompleted: p.sessions_completed || 0,
        rank: i + 1,
        previousRank: i + 1, // would come from historical data
      }));

      setEntries(all);
      const me = all.find(e => e.userId === currentUserId) || null;
      setCurrentUserRank(me);
    } catch (err) {
      console.error('Leaderboard fetch failed:', err);
      // Fallback to localStorage stats for demo
      const stats = getUserStats();
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        const demo: LeaderboardEntry = {
          userId: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'You',
          email: session.user.email || '',
          xp: stats.xp,
          level: stats.level,
          title: stats.title,
          streak: stats.streakDays,
          cardsStudied: stats.cardsStudied,
          decksCreated: stats.decksCreated,
          sessionsCompleted: stats.sessionsCompleted,
          rank: 1,
          previousRank: 1,
        };
        setEntries([demo]);
        setCurrentUserRank(demo);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[#F0EFFE] text-lg font-light tracking-tight">Leaderboard</h1>
          <p className="text-[#5A5A72] text-xs -mt-1">Compete with top learners and climb the ranks</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-[#7C3AED]/15 text-[#8B5CF6] border border-[#7C3AED]/30'
                  : 'bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#3A3A4F]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="w-12 h-12 text-[#2A2A3A] mb-4" />
            <h3 className="text-sm font-medium text-[#F0EFFE] mb-1">No rankings yet</h3>
            <p className="text-xs text-[#5A5A72] max-w-sm">
              Start studying to appear on the leaderboard. Complete sessions, review cards, and earn XP!
            </p>
          </div>
        ) : (
          <>
            {/* Podium — Top 3 */}
            {top3.length >= 3 && (
              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
                <div className="flex items-end justify-center gap-4">
                  <PodiumCard entry={top3[1]} position={2} />
                  <PodiumCard entry={top3[0]} position={1} />
                  <PodiumCard entry={top3[2]} position={3} />
                </div>
              </div>
            )}

            {/* Rankings Table */}
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#2A2A3A] flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#F0EFFE] uppercase tracking-wider flex items-center gap-2">
                  <Users size={13} />
                  All Rankings
                </h3>
                <span className="text-[10px] text-[#5A5A72]">{entries.length} learners</span>
              </div>

              <div className="divide-y divide-[#2A2A3A]/30">
                {/* Header row */}
                <div className="px-5 py-2 grid grid-cols-[40px_1fr_80px_60px_60px] gap-3 text-[10px] font-semibold text-[#5A5A72] uppercase tracking-wider">
                  <span>Rank</span>
                  <span>Learner</span>
                  <span className="text-right">XP</span>
                  <span className="text-right">Streak</span>
                  <span className="text-right">Cards</span>
                </div>

                {rest.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`px-5 py-3 grid grid-cols-[40px_1fr_80px_60px_60px] gap-3 items-center text-xs transition-colors ${
                      currentUserRank?.userId === entry.userId
                        ? 'bg-[#7C3AED]/5 border-l-2 border-l-[#7C3AED]'
                        : 'hover:bg-[#1A1A24]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {getRankIcon(entry.rank)}
                      {getTrendIcon(entry.rank, entry.previousRank)}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED]/30 to-[#6D28D9]/30 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6] shrink-0">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#F0EFFE] font-medium truncate">{entry.name}</p>
                        <p className="text-[10px] text-[#5A5A72]">Lv.{entry.level} {entry.title}</p>
                      </div>
                    </div>
                    <div className="text-right font-semibold text-[#8B5CF6] tabular-nums">
                      {entry.xp.toLocaleString()}
                    </div>
                    <div className="text-right text-[#5A5A72] flex items-center justify-end gap-1 tabular-nums">
                      <Flame size={11} className="text-amber-400" />
                      {entry.streak}
                    </div>
                    <div className="text-right text-[#5A5A72] flex items-center justify-end gap-1 tabular-nums">
                      <BookOpen size={11} />
                      {entry.cardsStudied.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current User Rank */}
            {currentUserRank && (
              <div className="bg-[#111118] border border-[#7C3AED]/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {currentUserRank.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F0EFFE]">{currentUserRank.name}</p>
                  <p className="text-[10px] text-[#5A5A72]">Your current standing</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#8B5CF6] tabular-nums">#{currentUserRank.rank}</p>
                  <p className="text-[10px] text-[#5A5A72]">{currentUserRank.xp.toLocaleString()} XP</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
