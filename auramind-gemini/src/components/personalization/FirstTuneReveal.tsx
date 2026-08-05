/**
 * FirstTuneReveal — doesn't render until the user's personalized FSRS weights
 * are produced for the first time. Then it shows a quiet panel that explains
 * what the bias actually does, gives a one-tap path into the personalisation
 * dashboard, and never shows again after the user dismisses (12h fallback).
 *
 * Lives at the root of the dashboard shell so it's the first thing the user
 * sees on the day the back end quietly tunes their schedule.
 */
import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirstTuneReveal } from '../../hooks/useFirstTuneReveal';
import { useCurrentUserId } from '../../hooks/useCurrentUserId';
import { usePersonalizedFsrs } from '../../hooks/usePersonalizedFsrs';
import {
  chipCopyForProfile,
} from '../../services/study/fsrsAdaptation';
import { PROFILE_DIFFICULTY_CENTER } from '../../services/study/fsrs';

export const FirstTuneReveal: React.FC = () => {
  const userId = useCurrentUserId();
  const personalization = usePersonalizedFsrs(userId);
  const navigate = useNavigate();
  const { shouldShow, markShown, isReady } = useFirstTuneReveal(
    personalization.personalized,
    personalization.profileLabel !== null,
  );

  // Auto-dismiss after 12h if the user never interacts. People who leave
  // it pinned open will eventually get rid of it without needing to.
  useEffect(() => {
    if (!shouldShow) return;
    const id = window.setTimeout(markShown, 12 * 60 * 60 * 1000);
    return () => window.clearTimeout(id);
  }, [shouldShow, markShown]);

  const copy = useMemo(
    () => chipCopyForProfile(personalization.profileLabel),
    [personalization.profileLabel],
  );

  if (!isReady || !shouldShow || !copy) return null;

  const center = personalization.profileLabel
    ? PROFILE_DIFFICULTY_CENTER[personalization.profileLabel] ?? null
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-gradient-to-br from-[#111118] to-[#1A1A24] border border-[#7C3AED]/30 rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.25)] p-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-[#F0EFFE] text-sm font-medium">AuraMind learned your rhythm</h3>
              <p className="text-[10px] text-[#5A5A72] uppercase tracking-widest font-bold mt-0.5">
                Personalized FSRS · first tune
              </p>
            </div>
          </div>
          <button
            onClick={markShown}
            aria-label="Dismiss"
            className="text-[#5A5A72] hover:text-[#F0EFFE] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          <Row label="Profile" value={copy.label} />
          {center !== null && <Row label="Difficulty center" value={`${center} / 10`} />}
          <Row label="What changes" value={copy.blurb} wrap />
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A3A]">
          <button
            onClick={() => {
              markShown();
              navigate('/dashboard/personalization');
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] transition-colors"
          >
            See my FSRS profile
            <ArrowRight size={12} />
          </button>
          <button
            onClick={markShown}
            className="px-3 py-2 text-[#5A5A72] text-xs hover:text-[#F0EFFE] transition-colors"
          >
            Just study
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function Row({ label, value, wrap }: { label: string; value: string; wrap?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-[10px] text-[#5A5A72] uppercase tracking-widest font-bold w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`text-[#F0EFFE] flex-1 ${wrap ? 'leading-relaxed' : ''}`}>{value}</span>
    </div>
  );
}

export default FirstTuneReveal;
