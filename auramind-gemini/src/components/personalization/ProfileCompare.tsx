/**
 * ProfileCompare — pick a candidate catalog profile and A/B it against the
 * user's currently tuned weights, on the user's own card history, before
 * writing anything.
 *
 * Surfaces:
 *   - profile picker (any of the six catalog profiles)
 *   - per-grade interval comparison (avg across sampled cards)
 *   - 30-day retention curve (see RetentionCurvePlot)
 *   - sample cards preview with per-grade intervals per card
 *   - recommendation gate (Switch / Stay / Tie)
 *   - confirmation modal that writes only when the alt improves loss by
 *     more than the neutral threshold
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, ArrowRight, Sparkles } from '@/components/icons';
import type { Card } from '../../types';
import {
  CATALOG_LABELS,
  chipCopyForProfile,
  getAutoAltProfileLabel,
  getCatalogCenter,
  getCatalogWeights,
  safeUpsertUserFsrsParams,
} from '../../services/study/fsrsAdaptation';
import {
  compareProfiles,
  pickSampleCards,
  GRADE_LABELS,
  type ComparisonResult,
  type Grade,
  type ReviewSample,
} from '../../services/study/profileSimulator';
import { RetentionCurvePlot } from './RetentionCurvePlot';

interface ProfileCompareProps {
  /** Logged-in user; null = signed out, panel-gated by parent elsewhere
   *  for the "loading" branch, so this prop only carries the live id. */
  userId: string | null;
  /** Current tuned weights (or null = no tuning yet). */
  currentWeights: number[] | null;
  /** Current profile label (or null for default tuning). */
  currentLabel: string | null;
  /** Difficulty center for the current profile (null when not tuned). */
  currentCenter: number | null;
  /** All cards in the user's account (used to pick the comparison sample). */
  allCards: Card[];
  /** Recent review samples for simulated loss comparison. */
  reviews: ReviewSample[];
  /** The user's actual lifetime review_count from `user_fsrs_params`. Used
   *  as p_review_count on a Switch so the freshness gate in
   *  loadPersonalizedFsrs continues to treat them as "above the gate"
   *  after the switch. Defaults to reviews.length (sample size) when null. */
  currentReviewCount?: number | null;
  /** Fires after a successful profile switch so the parent can reload. */
  onAfterSwitch?: () => Promise<void> | void;
}

const DEFAULT_ALT_LABEL = 'fast-learner';
const GRADES: Grade[] = [0, 1, 2, 3];

function formatInterval(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return '—';
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${days.toFixed(1)}d`;
  if (days < 365) return `${(days / 30).toFixed(1)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

function toneForDelta(currentVal: number, altVal: number, lowerIsHarder: boolean): { color: string; arrow: string } {
  if (!Number.isFinite(currentVal) || !Number.isFinite(altVal)) return { color: 'text-[#5A5A72]', arrow: '' };
  const diff = altVal - currentVal;
  const magnitude = Math.abs(diff) / Math.max(1, currentVal);
  if (magnitude < 0.05) return { color: 'text-[#5A5A72]', arrow: '·' };
  const positive = lowerIsHarder ? diff < 0 : diff > 0;
  return {
    color: positive ? 'text-emerald-300' : 'text-rose-300',
    arrow: positive ? '↑' : '↓',
  };
}

export const ProfileCompare: React.FC<ProfileCompareProps> = ({
  userId,
  currentWeights,
  currentLabel,
  currentCenter,
  allCards,
  reviews,
  currentReviewCount = null,
  onAfterSwitch,
}) => {
  const [manualAltLabel, setManualAltLabel] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-pick via the shared helper so the LiveCompareBadge (and any
  // future surface) sees the same algorithm. When the user picks manually,
  // that choice wins until they re-render. When currentLabel/Center are
  // null (still loading or untuned), fall back to DEFAULT_ALT_LABEL so
  // the picker still has a comparison target.
  const autoAltLabel = useMemo(
    () => getAutoAltProfileLabel(currentLabel, currentCenter) ?? DEFAULT_ALT_LABEL,
    [currentLabel, currentCenter],
  );
  const altLabel = manualAltLabel ?? autoAltLabel;

  // Stable per-id sample of the user's actual cards. Re-picks when the
  // account-wide card list changes; otherwise reuses the picked sample.
  const sampleCards = useMemo(() => pickSampleCards(allCards, 5), [allCards]);

  const altWeights = useMemo(() => getCatalogWeights(altLabel) ?? [], [altLabel]);
  // Single source of truth for catalog center — never shadow fsrs.ts's
  // PROFILE_DIFFICULTY_CENTER with a hand-rolled map that can drift.
  const altCenter = useMemo(() => getCatalogCenter(altLabel), [altLabel]);

  const compare: ComparisonResult | null = useMemo(() => {
    if (!currentWeights || !altWeights.length || sampleCards.length === 0) return null;
    return compareProfiles({
      currentWeights,
      altWeights,
      currentLabel,
      altLabel,
      currentCenter,
      altCenter,
      sampleCards,
      reviews,
      curveDays: 30,
    });
  }, [currentWeights, altWeights, currentLabel, altLabel, currentCenter, altCenter, sampleCards, reviews]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(id);
  }, [flash]);

  // Clear any lingering "Switched to X" toast when the alt (or auto-pick)
  // changes; otherwise the toast outlives the comparison it was about.
  useEffect(() => {
    setFlash(null);
  }, [altLabel]);

  const altChip = chipCopyForProfile(altLabel);

  const handleSwitch = async () => {
    if (!userId || !altWeights.length || !compare) return;
    setSwitching(true);
    setError(null);
    // p_review_count MUST be the user's lifetime review_count, NOT the
    // A/B sample size — the freshness gate (`existing.review_count >=
    // FSRS_TUNING_GATE`) uses it on the next read. Fall back to the
    // sample size only when we genuinely have nothing else (first-ever
    // tuning row, no prior reviews to read from).
    const reviewCountTotal = currentReviewCount != null
      ? currentReviewCount
      : Math.max(reviews.length, 0);
    const ok = await safeUpsertUserFsrsParams(userId, {
      weights: altWeights,
      reviewCountTotal,
      accuracyBaseline: 0,
      lossValue: compare.altLoss,
      profileLabel: altLabel,
    });
    setSwitching(false);
    setConfirmOpen(false);
    if (ok) {
      setFlash(`Switched your FSRS shape to ${altLabel}.`);
      await onAfterSwitch?.();
    } else {
      setError('Switch failed. Check the console for details.');
    }
  };

  // Empty / not-ready states
  if (userId === null) {
    return <div className="text-xs text-[#5A5A72] py-8 text-center">Sign in to compare profiles.</div>;
  }
  if (!currentWeights) {
    return (
      <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-8 text-center space-y-2">
        <Sparkles size={28} className="text-[#3A3A4F] mx-auto" />
        <p className="text-[#F0EFFE] text-sm font-medium">No tuned shape yet</p>
        <p className="text-[#5A5A72] text-xs">
          Once you cross 50 reviews, AuraMind learns your recall curve. Then you can
          preview any catalog profile against your own cards here.
        </p>
      </div>
    );
  }
  if (sampleCards.length === 0) {
    return (
      <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-8 text-center">
        <p className="text-[#F0EFFE] text-sm font-medium">No cards to compare against</p>
        <p className="text-[#5A5A72] text-xs mt-2">
          Create at least one deck with cards for A/B comparisons to be meaningful.
        </p>
      </div>
    );
  }
  if (!compare) {
    return <div className="text-xs text-[#5A5A72] py-6 text-center">Pick a profile to compare…</div>;
  }

  return (
    <section className="space-y-5">
      {/* Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A72]">
          Compare against
        </label>
        <select
          value={altLabel}
          onChange={e => setManualAltLabel(e.target.value)}
          className="bg-[#111118] border border-[#2A2A3A] rounded-lg px-3 py-2 text-xs text-[#F0EFFE] focus:outline-none focus:border-[#7C3AED]/40"
        >
          {CATALOG_LABELS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {altChip && (
          <span className="text-[10px] text-[#9090A8]">
            <span className="text-[#F0EFFE] font-medium">{altChip.label}</span> · {altChip.blurb}
          </span>
        )}
      </div>

      {/* Profile header compare row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <ProfileHeader
          title="Your tuned shape"
          label={currentLabel ?? 'default'}
          center={currentCenter}
        />
        <div className="flex items-center justify-center px-2">
          <ArrowLeftRight className="text-[#5A5A72]" size={16} />
        </div>
        <ProfileHeader
          title="Candidate shape"
          label={altLabel}
          center={altCenter}
          tone="alt"
        />
      </div>

      {/* Per-grade interval comparison */}
      <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-[#2A2A3A] text-[10px] uppercase tracking-widest font-bold text-[#5A5A72]">
          <span>Grade</span>
          <span className="text-right">Yours</span>
          <span className="text-right">Alt</span>
          <span className="text-right">Δ</span>
        </div>
        <div className="divide-y divide-[#2A2A3A]/40">
          {GRADES.map(g => {
            const cur = compare.currentAvgIntervals[g];
            const alt = compare.altAvgIntervals[g];
            // Higher interval under alt = friendlier. Marker picks that direction.
            const tone = toneForDelta(cur, alt, /*lowerIsHarder=*/ false);
            return (
              <div key={g} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-4 py-2 items-center text-xs font-mono tabular-nums">
                <span className="text-[#F0EFFE] font-sans">{GRADE_LABELS[g]}</span>
                <span className="text-right text-[#9090A8]">{formatInterval(cur)}</span>
                <span className="text-right text-[#F0EFFE]">{formatInterval(alt)}</span>
                <span className={`text-right ${tone.color}`}>{tone.arrow}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retention curve */}
      <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[#F0EFFE]">
            Predicted 30-day retrievability
          </h3>
          <span className="text-[10px] text-[#5A5A72]">
            averaged across {sampleCards.length} sampled {sampleCards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
        <RetentionCurvePlot
          points={compare.retention}
          labels={{
            current: currentLabel ?? 'yours',
            alt: altLabel,
          }}
        />
      </div>

      {/* Simulated loss badge */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-lg px-3 py-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A72] block">
            Simulated log-loss
          </span>
          <span className="text-sm font-mono tabular-nums text-[#F0EFFE]">
            {Number.isFinite(compare.currentLoss) ? compare.currentLoss.toFixed(3) : '—'}
            <ArrowRight size={12} className="inline mx-1 text-[#5A5A72]" />
            <span className={
              compare.recommendation === 'switch' ? 'text-emerald-300'
              : compare.recommendation === 'stay' ? 'text-[#F0EFFE]'
              : 'text-[#9090A8]'
            }>
              {Number.isFinite(compare.altLoss) ? compare.altLoss.toFixed(3) : '—'}
            </span>
          </span>
        </div>
        <RecommendationBadge
          recommendation={compare.recommendation}
          improvementPct={compare.improvementPct}
        />
        {flash && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-emerald-300">
            {flash}
          </motion.span>
        )}
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>

      {/* Sample cards preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#F0EFFE]">
          Sampled from your decks ({sampleCards.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {compare.cards.map((c, i) => (
            <div key={c.id} className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-3 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#5A5A72]">
                Card {i + 1}
              </div>
              <div className="text-xs text-[#F0EFFE] line-clamp-2">
                {c.frontPreview || '(empty front)'}
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono tabular-nums">
                {GRADES.map(g => {
                  const cur = c.currentGradeIntervals[g];
                  const alt = c.altGradeIntervals[g];
                  const curClr = Math.abs(cur - alt) < Math.max(1, cur) * 0.05 ? 'text-[#5A5A72]' : 'text-[#9090A8]';
                  const altClr = alt > cur ? 'text-emerald-300' : alt < cur ? 'text-rose-300' : 'text-[#9090A8]';
                  return (
                    <div key={g} className="text-center">
                      <div className="text-[#5A5A72]">{GRADE_LABELS[g]}</div>
                      <div className={curClr}>{formatInterval(cur)}</div>
                      <div className={altClr}>{formatInterval(alt)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={
            switching
            || compare.recommendation !== 'switch'
            || !Number.isFinite(compare.altLoss)
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={
            compare.recommendation === 'switch'
              ? `Switch to ${altLabel} — simulated ${compare.improvementPct >= 0 ? `${compare.improvementPct.toFixed(1)}% loss improvement` : 'no improvement'}`
              : 'Simulated loss is within the neutral threshold — staying put.'
          }
        >
          <Sparkles size={12} />
          Switch to {altLabel}
        </button>
        <span className="text-[10px] text-[#5A5A72]">
          Only writes if the candidate beats your current shape by &gt;0.5% loss.
        </span>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !switching && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="bg-[#111118] border border-[#2A2A3A] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-[#F0EFFE] text-base font-medium mb-2">
                Switch to {altLabel}?
              </h3>
              <p className="text-[#5A5A72] text-xs mb-4 leading-relaxed">
                Your tuned row will be replaced with the candidate profile weights.
                Existing cards keep their current difficulty — only new tuning and
                the next Rerun cycle use the new shape.
              </p>
              <div className="bg-[#0E0E15] border border-[#2A2A3A] rounded-lg p-3 mb-4">
                <div className="text-[10px] uppercase tracking-widest text-[#5A5A72] font-bold mb-1">
                  Simulated change
                </div>
                <div className="text-xs font-mono tabular-nums text-[#F0EFFE]">
                  loss {Number.isFinite(compare.currentLoss) ? compare.currentLoss.toFixed(3) : '—'}
                  {' → '}
                  <span className="text-emerald-300">
                    {Number.isFinite(compare.altLoss) ? compare.altLoss.toFixed(3) : '—'}
                  </span>
                  {compare.improvementPct !== 0 && (
                    <span className="ml-2 text-[#9090A8]">
                      ({compare.improvementPct >= 0 ? '+' : ''}{compare.improvementPct.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={switching}
                  className="px-3 py-2 text-[#5A5A72] text-xs hover:text-[#F0EFFE] disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitch}
                  disabled={switching}
                  className="px-3 py-2 rounded-lg bg-[#10B981] text-white text-xs font-medium hover:bg-[#059669] disabled:opacity-50 transition-colors"
                >
                  {switching ? 'Switching…' : `Switch to ${altLabel}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

function ProfileHeader({
  title, label, center, tone = 'current',
}: { title: string; label: string; center: number | null; tone?: 'current' | 'alt' }) {
  const stripe = tone === 'current' ? 'border-l-[#7C3AED]' : 'border-l-[#10B981]';
  return (
    <div className={`bg-[#111118] border border-[#2A2A3A] border-l-2 ${stripe} rounded-xl p-4`}>
      <div className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A72]">{title}</div>
      <div className="text-base text-[#F0EFFE] font-serif italic mt-1">{label}</div>
      {center !== null && (
        <div className="text-[10px] text-[#9090A8] mt-1">
          Difficulty center: <span className="font-mono text-[#F0EFFE]">{center}</span>
        </div>
      )}
    </div>
  );
}

function RecommendationBadge({
  recommendation, improvementPct,
}: { recommendation: 'switch' | 'stay' | 'tie'; improvementPct: number }) {
  const palette = {
    switch: { bg: 'bg-emerald-500/10 border-emerald-400/30', text: 'text-emerald-300', label: improvementPct >= 0 ? `Switch (${improvementPct.toFixed(1)}% loss ↓)` : 'Switch' },
    stay:   { bg: 'bg-[#1A1A24] border-[#2A2A3A]',                 text: 'text-[#F0EFFE]',   label: 'Stay with current' },
    tie:    { bg: 'bg-[#1A1A24] border-[#2A2A3A]',                 text: 'text-[#9090A8]',   label: 'Within noise' },
  }[recommendation];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${palette.bg} ${palette.text} text-[11px] font-medium`}>
      {palette.label}
    </span>
  );
}

export default ProfileCompare;
