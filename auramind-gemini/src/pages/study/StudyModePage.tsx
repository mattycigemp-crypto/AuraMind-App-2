import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Mic2, Volume2, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Deck, Card, Rating, UserProfile } from '../../types';
import { PageHeader, CitationStack } from '../../components/shared/PageComponents';
import MathRichText from '../../components/shared/MathRichText';
import { generateStudyBuddyResponse } from '../../services/api/deepseekService';
import { useIsMobile } from '../../hooks/use-mobile';

export const StudyModeRoute = ({
  decks,
  cards,
  setActiveDeckId,
  rateCard,
}: {
  decks: Deck[];
  cards: Card[];
  setActiveDeckId: (deckId: string) => void;
  rateCard: (id: string, rating: Rating) => Promise<void> | void;
}) => {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [voiceQuestions, setVoiceQuestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);
  const reminderTimeoutRef = useRef<number | null>(null);
  const [voiceReminderEnabled, setVoiceReminderEnabled] = useState(false);
  const [voiceReminderMode, setVoiceReminderMode] = useState<'fixed' | 'random'>('random');
  const [voiceReminderMinutes, setVoiceReminderMinutes] = useState(3);
  const [autoListenAfterPrompt, setAutoListenAfterPrompt] = useState(false);
  const VOICE_PREFS_KEY = 'auramind.voiceStudyPrefs';
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (deckId) setActiveDeckId(deckId);
  }, [deckId, setActiveDeckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(VOICE_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        enabled?: boolean;
        mode?: 'fixed' | 'random';
        minutes?: number;
        autoListen?: boolean;
      };
      if (typeof parsed.enabled === 'boolean') setVoiceReminderEnabled(parsed.enabled);
      if (parsed.mode === 'fixed' || parsed.mode === 'random') setVoiceReminderMode(parsed.mode);
      if (typeof parsed.minutes === 'number') setVoiceReminderMinutes(Math.min(60, Math.max(1, Math.round(parsed.minutes))));
      if (typeof parsed.autoListen === 'boolean') setAutoListenAfterPrompt(parsed.autoListen);
    } catch {
      // Ignore malformed local settings and continue with defaults.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      enabled: voiceReminderEnabled,
      mode: voiceReminderMode,
      minutes: voiceReminderMinutes,
      autoListen: autoListenAfterPrompt,
    };
    window.localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(payload));
  }, [voiceReminderEnabled, voiceReminderMode, voiceReminderMinutes, autoListenAfterPrompt]);

  if (!deckId) return <Navigate to="/dashboard" replace />;

  const deck = decks.find((item) => item.id === deckId);
  const dueCards = cards.filter((card) => card.deckId === deckId).sort((a, b) => a.nextReview - b.nextReview);

  if (!deck) return <Navigate to="/dashboard" replace />;

  if (dueCards.length === 0) {
    return (
      <div className="space-y-8 py-4">
        <button onClick={() => navigate(`/deck/${deckId}`)} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Deck
        </button>
        <div className="architectural-panel p-20 text-center space-y-6">
          <Check size={64} className="mx-auto text-arch-fg" />
          <h1 className="text-arch-impact text-[40px] italic lowercase">all caught up.</h1>
          <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic">There are no scheduled cards in this deck right now.</p>
        </div>
      </div>
    );
  }

  const safeCurrentIndex = Math.min(currentIndex, dueCards.length - 1);
  const activeCard = dueCards[safeCurrentIndex];

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceAnswer = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // No-op: recognizer can throw when already stopped.
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startVoiceAnswer = (promptedQuestion?: string) => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice capture is not supported in this browser.');
      return;
    }

    stopVoiceAnswer();
    setVoiceError('');
    setVoiceTranscript('');
    setVoiceFeedback('');
    setVoiceQuestions([]);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError('Voice capture failed. Try again or use manual review.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setVoiceTranscript(transcript);
      setIsCoaching(true);

      try {
        const question = promptedQuestion || activeCard.question;
        const answer = promptedQuestion ? activeCard.answer : activeCard.answer;
        const response = await generateStudyBuddyResponse(
          'Evaluate the learner answer, identify what was correct or missing, and respond like a concise Socratic coach.',
          `Card question: ${question}\nCorrect answer: ${answer}\nLearner answer: ${transcript}`
        );
        setVoiceFeedback(response.response);
        setVoiceQuestions(response.followUpQuestions || []);
      } catch {
        setVoiceFeedback('Voice answer captured, but coaching feedback could not be generated.');
      } finally {
        setIsCoaching(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const getReminderDelayMs = () => {
    const baseMs = Math.max(1, voiceReminderMinutes) * 60_000;
    if (voiceReminderMode === 'fixed') return baseMs;
    const minMs = 45_000;
    const maxMs = Math.max(baseMs, minMs + 15_000);
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  };

  const clearVoiceReminderTimer = () => {
    if (reminderTimeoutRef.current) {
      window.clearTimeout(reminderTimeoutRef.current);
      reminderTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!voiceReminderEnabled || showAnswer) {
      clearVoiceReminderTimer();
      return;
    }

    const schedulePrompt = () => {
      clearVoiceReminderTimer();
      reminderTimeoutRef.current = window.setTimeout(() => {
        speakText(`Flashcard reminder. ${activeCard.question}`);
        if (autoListenAfterPrompt) {
          window.setTimeout(() => startVoiceAnswer(activeCard.question), 1400);
        }
        schedulePrompt();
      }, getReminderDelayMs());
    };

    schedulePrompt();
    return clearVoiceReminderTimer;
  }, [
    activeCard.id,
    activeCard.question,
    autoListenAfterPrompt,
    showAnswer,
    voiceReminderEnabled,
    voiceReminderMode,
    voiceReminderMinutes,
  ]);

  useEffect(() => () => {
    clearVoiceReminderTimer();
    stopVoiceAnswer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleRating = async (rating: Rating) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (rating >= Rating.GOOD) navigator.vibrate(24);
      else navigator.vibrate([14, 30, 14]);
    }
    await rateCard(activeCard.id, rating);
    setShowAnswer(false);
    setVoiceTranscript('');
    setVoiceFeedback('');
    setVoiceQuestions([]);
    setVoiceError('');
    setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return;
      if (event.key === ' ') {
        event.preventDefault();
        setShowAnswer((prev) => !prev);
        return;
      }
      if (!showAnswer) return;
      if (event.key === '1') handleRating(Rating.AGAIN);
      if (event.key === '2') handleRating(Rating.HARD);
      if (event.key === '3') handleRating(Rating.GOOD);
      if (event.key === '4') handleRating(Rating.EASY);
      if (event.key === 'ArrowLeft') handleRating(Rating.AGAIN);
      if (event.key === 'ArrowRight') handleRating(Rating.GOOD);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAnswer, activeCard.id]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !showAnswer) return;
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !showAnswer || touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(delta) < 60) return;
    if (delta > 0) {
      handleRating(Rating.GOOD);
      return;
    }
    handleRating(Rating.AGAIN);
  };

  return (
    <div className={`space-y-10 py-4 ${highContrastMode ? 'contrast-125 saturate-0' : ''}`}>
      <PageHeader
        title="STUDY MODE."
        subtitle={`${deck.title} • ${safeCurrentIndex + 1} of ${dueCards.length} queued`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHighContrastMode((prev) => !prev)}
              aria-label="Toggle high contrast mode"
              className="inline-flex items-center gap-2 border border-arch-border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-arch-fg"
            >
              {highContrastMode ? 'Contrast On' : 'Contrast Off'}
            </button>
            <button onClick={() => navigate(`/deck/${deckId}`)} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Deck
            </button>
          </div>
        }
      />

      <div className="architectural-panel p-10 space-y-10">
        <div className="h-1 bg-arch-fg/10">
          <motion.div className="h-full bg-arch-fg" animate={{ width: `${((safeCurrentIndex + 1) / dueCards.length) * 100}%` }} />
        </div>

        <div
          className="border border-arch-border bg-arch-fg/5 p-12 min-h-[480px] flex flex-col justify-between"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div>
            <p className="text-arch-eyebrow mb-10">{showAnswer ? 'Response sequence' : 'Inquiry protocol'}</p>
            <h2 className="text-4xl font-black leading-tight italic tracking-tighter text-arch-fg">
              <MathRichText text={showAnswer ? activeCard.answer : activeCard.question} block />
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <button aria-label="Read current flashcard aloud" onClick={() => speakText(showAnswer ? activeCard.answer : activeCard.question)} className="inline-flex items-center gap-2 border border-arch-border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">
                <Volume2 size={14} />
                Read Aloud
              </button>
              <button aria-label="Speak answer with voice recognition" onClick={startVoiceAnswer} className="inline-flex items-center gap-2 border border-arch-border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">
                <Mic2 size={14} />
                {isListening ? 'Listening...' : 'Voice Socratic'}
              </button>
              <button
                onClick={() => {
                  setVoiceReminderEnabled((prev) => !prev);
                  setVoiceError('');
                }}
                className={`inline-flex items-center gap-2 border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] ${
                  voiceReminderEnabled ? 'border-arch-fg text-arch-fg bg-arch-fg/10' : 'border-arch-border text-arch-fg'
                }`}
              >
                <Bell size={14} />
                {voiceReminderEnabled ? 'Voice Reminders On' : 'Voice Reminders Off'}
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="border border-arch-border px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-arch-muted flex items-center justify-between">
                Reminder Mode
                <select
                  value={voiceReminderMode}
                  onChange={(event) => setVoiceReminderMode(event.target.value as 'fixed' | 'random')}
                  className="bg-transparent text-arch-fg text-[10px] uppercase tracking-[0.2em] outline-none"
                >
                  <option value="random" className="bg-black text-slate-900 dark:text-white">Random</option>
                  <option value="fixed" className="bg-black text-slate-900 dark:text-white">Fixed</option>
                </select>
              </label>
              <label className="border border-arch-border px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-arch-muted flex items-center justify-between">
                Interval (minutes)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={voiceReminderMinutes}
                  onChange={(event) => setVoiceReminderMinutes(Math.max(1, Number(event.target.value) || 1))}
                  className="w-14 bg-transparent text-right text-arch-fg outline-none"
                />
              </label>
              <button
                onClick={() => setAutoListenAfterPrompt((prev) => !prev)}
                className={`border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] inline-flex items-center justify-center gap-2 ${
                  autoListenAfterPrompt ? 'border-arch-fg text-arch-fg bg-arch-fg/10' : 'border-arch-border text-arch-muted'
                }`}
              >
                <Mic2 size={14} />
                {autoListenAfterPrompt ? 'Auto Listen On' : 'Auto Listen Off'}
              </button>
            </div>
            <CitationStack card={activeCard} />
          </div>

          {!showAnswer ? (
            <button aria-label="Reveal flashcard answer" onClick={() => setShowAnswer(true)} className="btn-arch self-start min-w-[200px]">
              Reveal Answer
            </button>
          ) : (
            <div className="grid sm:grid-cols-4 gap-4 pt-10 border-t border-arch-border/50">
              {[
                { label: 'Again', rating: Rating.AGAIN, tone: 'hover:border-red-500' },
                { label: 'Hard', rating: Rating.HARD, tone: 'hover:border-amber-500' },
                { label: 'Good', rating: Rating.GOOD, tone: 'hover:border-arch-fg' },
                { label: 'Easy', rating: Rating.EASY, tone: 'hover:border-emerald-500' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleRating(option.rating)}
                  aria-label={`Rate card ${option.label}`}
                  className={`border border-arch-border bg-arch-bg px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${option.tone}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {isMobile && showAnswer && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-arch-muted">
              Swipe right = know (Good), swipe left = review (Again)
            </p>
          )}
        </div>

        {(voiceTranscript || voiceFeedback || voiceError || isCoaching) && (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border border-arch-border bg-arch-bg p-6">
              <p className="text-arch-eyebrow">Voice Capture</p>
              <p className="mt-4 text-sm text-arch-fg leading-relaxed">{voiceTranscript || (isListening ? 'Listening for your spoken answer...' : 'No voice response captured yet.')}</p>
              {voiceError && <p className="mt-4 text-xs text-red-400">{voiceError}</p>}
            </div>
            <div className="border border-arch-border bg-arch-bg p-6">
              <p className="text-arch-eyebrow">Socratic Coach</p>
              <p className="mt-4 text-sm text-arch-fg leading-relaxed">{isCoaching ? 'Analyzing your answer and preparing follow-up prompts...' : voiceFeedback || 'Speak an answer to get guided feedback.'}</p>
              {voiceQuestions.length > 0 && (
                <div className="mt-5 space-y-3">
                  {voiceQuestions.map((question) => (
                    <div key={question} className="border border-arch-border bg-arch-fg/[0.03] p-3 text-xs text-arch-muted">
                      {question}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
