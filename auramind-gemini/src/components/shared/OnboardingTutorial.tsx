import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon as Sparkles,
  BrainCircuitIcon as BrainCircuit,
  CheckCircle2Icon as CheckCircle2,
  ArrowRightIcon as ArrowRight,
  BookOpenIcon as BookOpen,
  PlayIcon as Play,
  AwardIcon as Award,
  UserIcon as User,
} from '../icons/CustomIcons';
import { PROF_AURA_PERSONALITY_OPTIONS, setStoredPersonality, type ProfAuraPersonality } from '../../lib/profAuraPersonality';

// ─── Types ───

type OnboardingStep = 'welcome' | 'personalize' | 'personality' | 'create-deck' | 'flip-card' | 'celebrate';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// ─── Study topics for personalization ───

const TOPICS = [
  { emoji: '🧬', label: 'Biology' },
  { emoji: '💻', label: 'Computer Science' },
  { emoji: '📐', label: 'Mathematics' },
  { emoji: '🗣️', label: 'Languages' },
  { emoji: '⚗️', label: 'Chemistry' },
  { emoji: '📜', label: 'History' },
  { emoji: '⚖️', label: 'Law' },
  { emoji: '💊', label: 'Medicine' },
  { emoji: '🎨', label: 'Art & Design' },
  { emoji: '🎵', label: 'Music Theory' },
  { emoji: '📊', label: 'Business' },
  { emoji: '🧠', label: 'Psychology' },
];

// ─── Demo flashcard for learn-by-doing step ───

const DEMO_CARD = {
  front: 'What is the powerhouse of the cell?',
  back: 'The mitochondrion — it converts nutrients into ATP through cellular respiration.',
};

// ─── Step definitions ───

const STEPS: { id: OnboardingStep; icon: React.FC<{ size?: number; className?: string }>; title: string; subtitle: string }[] = [
  { id: 'welcome', icon: Sparkles, title: 'Welcome to AuraMind', subtitle: 'AI-powered study, backed by memory science' },
  { id: 'personalize', icon: BrainCircuit, title: 'What are you studying?', subtitle: 'We\'ll tailor your experience' },
  { id: 'personality', icon: User, title: 'Pick Prof. Aura\'s style', subtitle: 'How should your AI coach talk to you?' },
  { id: 'create-deck', icon: BookOpen, title: 'Create your first deck', subtitle: 'AI generates cards instantly from any topic' },
  { id: 'flip-card', icon: Play, title: 'Learn by doing', subtitle: 'Flip a real flashcard — this is how you study' },
  { id: 'celebrate', icon: Award, title: 'You\'re all set!', subtitle: '3 steps to build unstoppable momentum' },
];

// ─── COMPONENT ───

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<ProfAuraPersonality>('default');
  const [deckName, setDeckName] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const isLastStep = currentStep === 'celebrate';

  const goToStep = useCallback((step: OnboardingStep, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir);
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1].id, 'forward');
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) {
      goToStep(STEPS[idx - 1].id, 'backward');
    }
  }, [currentStep, goToStep]);

  const handleComplete = useCallback(() => {
    // Persist tutorial completion
    try {
      const stored = localStorage.getItem('auramind:completedTutorials');
      const completed = stored ? JSON.parse(stored) : [];
      if (!completed.includes('onboarding')) {
        completed.push('onboarding');
        localStorage.setItem('auramind:completedTutorials', JSON.stringify(completed));
      }
      // Also save personalization
      if (selectedTopic) {
        localStorage.setItem('auramind:studyTopic', selectedTopic);
      }
      if (selectedPersonality) {
        setStoredPersonality(selectedPersonality);
      }
      if (deckName) {
        localStorage.setItem('auramind:suggestedDeck', deckName);
      }
    } catch {}

    // Trigger confetti
    const event = new CustomEvent('auramind:celebrate', { detail: { reason: 'onboarding' } });
    window.dispatchEvent(event);

    onComplete?.();
    onClose();
  }, [selectedTopic, selectedPersonality, deckName, onComplete, onClose]);

  const handleSkip = useCallback(() => {
    try {
      const stored = localStorage.getItem('auramind:completedTutorials');
      const completed = stored ? JSON.parse(stored) : [];
      if (!completed.includes('onboarding')) {
        completed.push('onboarding');
        localStorage.setItem('auramind:completedTutorials', JSON.stringify(completed));
      }
    } catch {}
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const CurrentIcon = STEPS[stepIndex].icon;

  // Slide animation variants
  const slideVariants = {
    enter: (dir: string) => ({
      x: dir === 'forward' ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: string) => ({
      x: dir === 'forward' ? -80 : 80,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal card */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-lg rounded-3xl border border-[#2A2A3A] bg-[#0A0A0F] shadow-[0_0_80px_rgba(124,58,237,0.15)] overflow-hidden"
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', filter: 'blur(60px)' }}
          />

          <div className="relative z-10 p-8 md:p-10">
            {/* ─── Progress dots ─── */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => i < stepIndex ? goToStep(step.id, 'backward') : undefined}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i === stepIndex
                        ? 'bg-violet-500 w-7 shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                        : i < stepIndex
                          ? 'bg-violet-500/60 hover:bg-violet-500'
                          : 'bg-[#2A2A3A]'
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                    disabled={i > stepIndex}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#5A5A72]">
                  {stepIndex + 1}/{STEPS.length}
                </span>
                <button
                  onClick={handleSkip}
                  className="text-[10px] font-bold text-[#5A5A72] hover:text-[#9090A8] transition-colors uppercase tracking-wider"
                >
                  Skip tour
                </button>
              </div>
            </div>

            {/* ─── Step content — animated ─── */}
            <div className="min-h-[260px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* ── WELCOME ── */}
                  {currentStep === 'welcome' && (
                    <div className="space-y-6 text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center">
                        <Sparkles size={28} className="text-violet-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#F0EFFE] mb-2">Welcome to AuraMind</h2>
                        <p className="text-sm text-[#9090A8] leading-relaxed max-w-xs mx-auto">
                          AI generates your flashcards. Science schedules your reviews. <span className="text-[#F0EFFE] font-medium">You just show up.</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        {[
                          { icon: '🧠', label: 'FSRS v5\nSpaced Repetition' },
                          { icon: '🤖', label: 'AI Deck\nGeneration' },
                          { icon: '📱', label: 'Web, Desktop\n& Mobile' },
                        ].map(f => (
                          <div key={f.label} className="p-3 rounded-xl bg-[#111118] border border-[#2A2A3A] text-center">
                            <div className="text-xl mb-1">{f.icon}</div>
                            <p className="text-[9px] text-[#9090A8] leading-tight whitespace-pre-line">{f.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── PERSONALIZE ── */}
                  {currentStep === 'personalize' && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mb-3">
                          <BrainCircuit size={24} className="text-violet-400" />
                        </div>
                        <h2 className="text-lg font-black text-[#F0EFFE] mb-1">What are you studying?</h2>
                        <p className="text-xs text-[#9090A8]">Pick a topic — we'll suggest the perfect starter deck.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {TOPICS.map(t => (
                          <button
                            key={t.label}
                            onClick={() => setSelectedTopic(t.label)}
                            className={`p-3 rounded-xl border transition-all text-center ${
                              selectedTopic === t.label
                                ? 'border-violet-500/50 bg-violet-600/10 ring-1 ring-violet-500/30'
                                : 'border-[#2A2A3A] bg-[#111118] hover:border-violet-600/30'
                            }`}
                          >
                            <div className="text-lg mb-0.5">{t.emoji}</div>
                            <div className="text-[9px] text-[#9090A8] font-medium">{t.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── PERSONALITY ── */}
                  {currentStep === 'personality' && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mb-3">
                          <User size={24} className="text-violet-400" />
                        </div>
                        <h2 className="text-lg font-black text-[#F0EFFE] mb-1">Pick Prof. Aura's style</h2>
                        <p className="text-xs text-[#9090A8]">How should your AI coach talk to you? You can change this anytime.</p>
                      </div>
                      <div className="space-y-2">
                        {PROF_AURA_PERSONALITY_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedPersonality(opt.id)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                              selectedPersonality === opt.id
                                ? 'border-violet-500/50 bg-violet-600/10 ring-1 ring-violet-500/30'
                                : 'border-[#2A2A3A] bg-[#111118] hover:border-violet-600/30'
                            }`}
                          >
                            <span className="text-xl shrink-0">{opt.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#F0EFFE]">{opt.label}</p>
                              <p className="text-[10px] text-[#5A5A72] leading-snug mt-0.5">{opt.description}</p>
                            </div>
                            {selectedPersonality === opt.id && (
                              <CheckCircle2 size={16} className="text-violet-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── CREATE DECK ── */}
                  {currentStep === 'create-deck' && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center mb-3">
                          <BookOpen size={24} className="text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-black text-[#F0EFFE] mb-1">Name your first deck</h2>
                        <p className="text-xs text-[#9090A8]">
                          {selectedTopic ? `Great choice! Let's create a "${selectedTopic}" deck.` : 'AI will generate flashcards from your topic.'}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={deckName}
                        onChange={e => setDeckName(e.target.value)}
                        placeholder={selectedTopic ? `${selectedTopic} Essentials` : 'e.g., Cell Biology, React Hooks, Spanish Verbs...'}
                        className="w-full px-5 py-4 rounded-2xl bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-sm placeholder:text-[#5A5A72] focus:outline-none focus:border-violet-500/40 transition-all text-center font-medium"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && deckName.trim()) nextStep(); }}
                      />
                      {deckName.trim() && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center"
                        >
                          <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-1" />
                          <p className="text-[11px] text-emerald-300 font-medium">
                            AI will generate 10–20 flashcards for "{deckName}"
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ── FLIP CARD (learn by doing) ── */}
                  {currentStep === 'flip-card' && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center mb-3">
                          <Play size={24} className="text-amber-400" />
                        </div>
                        <h2 className="text-lg font-black text-[#F0EFFE] mb-1">Try flipping a card</h2>
                        <p className="text-xs text-[#9090A8]">Tap the card to reveal the answer — this is how every study session works.</p>
                      </div>

                      {/* Interactive flashcard */}
                      <div
                        onClick={() => setCardFlipped(!cardFlipped)}
                        className="relative w-full h-44 cursor-pointer select-none"
                        style={{ perspective: '1000px' }}
                      >
                        <motion.div
                          className="w-full h-full"
                          animate={{ rotateY: cardFlipped ? 180 : 0 }}
                          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Front */}
                          <div
                            className="absolute inset-0 rounded-2xl border border-[#2A2A3A] bg-[#111118] flex flex-col items-center justify-center p-6"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72] mb-3">Question</span>
                            <p className="text-base font-bold text-[#F0EFFE] text-center leading-relaxed">{DEMO_CARD.front}</p>
                            <span className="mt-4 text-[9px] text-[#5A5A72]">Tap to flip →</span>
                          </div>
                          {/* Back */}
                          <div
                            className="absolute inset-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center p-6"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">Answer</span>
                            <p className="text-sm text-[#F0EFFE] text-center leading-relaxed">{DEMO_CARD.back}</p>
                            {cardFlipped && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 flex items-center gap-2"
                              >
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-medium">Got it! This is spaced repetition.</span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </div>

                      {cardFlipped && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-[10px] text-[#5A5A72]"
                        >
                          Rate your recall: Again · Hard · Good · Easy → AI schedules the perfect next review
                        </motion.p>
                      )}
                    </div>
                  )}

                  {/* ── CELEBRATE ── */}
                  {currentStep === 'celebrate' && (
                    <div className="space-y-6 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                        className="w-20 h-20 mx-auto rounded-full bg-violet-600/10 border-2 border-violet-500/30 flex items-center justify-center"
                      >
                        <Award size={36} className="text-violet-400" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl font-black text-[#F0EFFE] mb-2">You're all set!</h2>
                        <p className="text-sm text-[#9090A8] leading-relaxed max-w-xs mx-auto">
                          Here's your 3-step formula for unstoppable learning momentum:
                        </p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { step: 1, text: 'Create a deck (or let AI do it)', done: !!selectedTopic || !!deckName },
                          { step: 2, text: 'Study 5 cards — takes 2 minutes', done: cardFlipped },
                          { step: 3, text: 'Come back tomorrow — streak begins', done: true },
                        ].map(item => (
                          <div key={item.step} className="flex items-center gap-3 p-3 rounded-xl bg-[#111118] border border-[#2A2A3A]">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2A2A3A] text-[#5A5A72]'
                            }`}>
                              {item.done ? <CheckCircle2 size={14} /> : item.step}
                            </div>
                            <span className={`text-xs ${item.done ? 'text-[#F0EFFE]' : 'text-[#5A5A72]'}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ─── Navigation ─── */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#2A2A3A]">
              <div>
                {stepIndex > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2.5 rounded-xl border border-[#2A2A3A] text-[#9090A8] text-xs font-bold hover:text-[#F0EFFE] hover:border-[#3A3A4F] transition-all flex items-center gap-2"
                  >
                    ← Back
                  </button>
                )}
              </div>

              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                >
                  Get Started
                  <Sparkles size={14} />
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={currentStep === 'personalize' && !selectedTopic || currentStep === 'create-deck' && !deckName.trim() || currentStep === 'flip-card' && !cardFlipped}
                  className="px-6 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default OnboardingTutorial;
