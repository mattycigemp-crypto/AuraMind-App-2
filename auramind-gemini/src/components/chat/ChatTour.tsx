/**
 * ChatTour — first-visit overlay that walks new users through the Prof. Aura
 * surfaces in 4 steps: Constellation profile, Context-aware prompts,
 * Voice-to-text mic toggle, Conversation history.
 *
 * Completion flag is written only when the user dismisses (clicks "Got it")
 * or finishes — NOT on mount. This avoids React-Strict-Mode double-mount
 * burning the flag before the user sees the tour. (Per the design review.)
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mic, History, ArrowRight } from '@/components/icons';
import ProfAura from './ProfAura';

const STORAGE_KEY = 'auramind.aurachat.tourComplete.v1';

interface Step {
  key: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  /** Approximate anchor description for the "highlight" ring. */
  anchor: string;
}

const STEPS: Step[] = [
  {
    key: 'avatar',
    icon: <ProfAura variant="rest" size={32} />,
    title: 'Meet Prof. Aura',
    body: 'Your AI study coach. The avatar reacts to your streak, your last activity, and even your voice when you speak.',
    anchor: 'top-center',
  },
  {
    key: 'prompts',
    icon: <Sparkles size={22} />,
    title: 'Smart follow-ups',
    body: 'Suggestion chips change shape after every reply. Save a card and you’ll see "Mnemonic" appear next; run a quiz and "Why was that right?" follows.',
    anchor: 'bottom',
  },
  {
    key: 'mic',
    icon: <Mic size={22} />,
    title: 'Speak your question',
    body: 'Tap the mic and dictation fills the input. Prof. Aura’s constellation expands as you speak so you know it’s listening.',
    anchor: 'bottom-right',
  },
  {
    key: 'history',
    icon: <History size={22} />,
    title: 'Pick up where you left off',
    body: 'Every chat auto-saves to your local history. Pin, rename, or search by what Prof. Aura actually said.',
    anchor: 'top-right',
  },
];

interface Props {
  /** Force-show (e.g. "?" menu). When true, overrides localStorage flag. */
  force?: boolean;
}

export default function ChatTour({ force = false }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (force) {
        setStep(0);
        setOpen(true);
        return;
      }
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setStep(0);
        setOpen(true);
      }
    } catch { /* intentionally ignored */ }
  }, [force]);

  /**
   * close — write the completion flag NOW (not on mount), per design review:
   * the flag should burn only when the user actually dismisses so Strict
   * Mode double-mount in dev doesn't pre-emptively hide the tour.
   */
  const close = (completed = true) => {
    if (completed) {
      try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* intentionally ignored */ }
    }
    setOpen(false);
  };

  const advance = () => {
    if (step >= STEPS.length - 1) close(true);
    else setStep(s => s + 1);
  };

  if (!open) return null;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Prof. Aura"
      >
        {/* Spotlight ring anchored to the current step. Use fixed because
            the chat container is dynamic and would de-sync if we anchored
            to layout DOM nodes. (Design review: tour pointer must NOT
            detach from the chat input as it auto-grows.) */}
        <SpotlightRing anchor={current.anchor} index={step} total={STEPS.length} />

        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-[#0E0E15] border border-[#2A2A3A] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] p-6"
        >
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                {current.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#A78BFA]">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="text-base font-semibold text-[#F0EFFE]">{current.title}</h2>
              </div>
            </div>
            <button
              onClick={() => close(true)}
              aria-label="Close tour"
              className="w-8 h-8 rounded-lg text-[#5A5A72] hover:text-[#F0EFFE] hover:bg-[#1A1A24] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <p className="text-sm text-[#C4C4D4] leading-relaxed">{current.body}</p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5 mb-5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === step ? 'bg-[#7C3AED] w-4' : 'bg-[#3A3A4F]'
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => close(true)}
              className="text-[11px] text-[#5A5A72] hover:text-[#9090A8] transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={advance}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {step === STEPS.length - 1 ? 'Got it' : 'Next'}
              <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * SpotlightRing — soft, animated ring drawn around where the step's anchor
 * lives. Each anchor maps to a fixed viewport position so we never have to
 * measure the chat DOM (which auto-grows as the user types — design risk).
 */
function SpotlightRing({ anchor, index, total }: { anchor: string; index: number; total: number }) {
  const position =
    anchor === 'top-center'
      ? 'top-1/3 left-1/2 -translate-x-1/2'
      : anchor === 'bottom'
      ? 'bottom-1/3 left-1/2 -translate-x-1/2'
      : anchor === 'bottom-right'
      ? 'bottom-32 right-6'
      : 'top-20 right-6';
  return (
    <motion.div
      key={`${anchor}-${index}`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className={`absolute w-32 h-32 rounded-full pointer-events-none ${position}`}
      style={{
        boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 0 0 32px rgba(124,58,237,0.06), 0 0 80px rgba(124,58,237,0.15)',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-end justify-center pb-2">
        <span className="text-[9px] font-mono text-[#A78BFA]">{index + 1}/{total}</span>
      </div>
    </motion.div>
  );
}
