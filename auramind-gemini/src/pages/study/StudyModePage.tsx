import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Lightbulb, X, Star, ChevronDown } from 'lucide-react';
import { dbService } from '../../services/database/dbService';
import { calculateSRS } from '../../services/study/srs';
import { Rating } from '../../types';
import type { Card, Deck } from '../../types';
import { VideoBackground } from '../../components/ui/VideoBackground';
import { addNotification } from '../../services/notifications/notificationStore';
import { toast } from 'sonner';

const RATING_BTNS = [
  { label: 'Again', rating: Rating.AGAIN, interval: '5m', color: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' },
  { label: 'Hard', rating: Rating.HARD, interval: '1d', color: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20' },
  { label: 'Good', rating: Rating.GOOD, interval: '3d', color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' },
  { label: 'Easy', rating: Rating.EASY, interval: '1w', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20' },
];

const KEY_MAP: Record<string, string> = {
  'Again': '1',
  'Hard': '2',
  'Good': '3',
  'Easy': '4',
};

const RatingButton = ({ label, rating, interval, color, onRate }: {
  label: string; rating: Rating; interval: string; color: string; onRate: (r: Rating) => void;
}) => (
  <motion.button
    onClick={() => onRate(rating)}
    className={`flex-1 px-4 py-3 rounded-xl border text-xs font-medium ${color} flex flex-col items-center gap-0.5`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <span>{label}</span>
    <span className="text-[10px] opacity-60">{interval}</span>
    <kbd className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded border border-current/20 bg-black/10 text-[9px] font-mono opacity-60">
      {KEY_MAP[label]}
    </kbd>
  </motion.button>
);

const SessionComplete = ({ stats, deckTitle, onRestart, onExit }: {
  stats: { total: number; correct: number }; deckTitle: string; onRestart: () => void; onExit: () => void;
}) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
    className="flex items-center justify-center min-h-screen bg-[#0A0A0F] p-6"
  >
    <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-8 max-w-sm w-full text-center">
      <div className="text-3xl mb-4"><Sparkles size={36} /></div>
      <h2 className="text-[#F0EFFE] text-lg font-light mb-1">Session Complete</h2>
      <p className="text-[#5A5A72] text-xs mb-6">{deckTitle}</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1A1A24] rounded-lg p-3">
          <div className="text-[#F0EFFE] text-xl font-semibold">{stats.total}</div>
          <div className="text-[#5A5A72] text-[11px]">Cards reviewed</div>
        </div>
        <div className="bg-[#1A1A24] rounded-lg p-3">
          <div className="text-emerald-400 text-xl font-semibold">{Math.round((stats.correct / Math.max(stats.total, 1)) * 100)}%</div>
          <div className="text-[#5A5A72] text-[11px]">Accuracy</div>
        </div>
      </div>
      <button onClick={onRestart} className="w-full py-2.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-all mb-2">Study Again</button>
      <button onClick={onExit} className="w-full py-2.5 border border-[#2A2A3A] text-[#5A5A72] text-xs font-medium rounded-lg hover:text-[#F0EFFE] transition-all">Back to Dashboard</button>
    </div>
  </motion.div>
);

export default function StudyModePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [displayedXP, setDisplayedXP] = useState(0);
  const particleId = useRef(0);
  const sessionStart = useRef(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tiltEnabled, setTiltEnabled] = useState(true);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await (await import('../../services/database/supabase')).supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }
        setUserId(user.id);
        const [fetchedDecks, allCards] = await Promise.all([
          dbService.fetchDecks(user.id),
          dbService.fetchCards(user.id),
        ]);
        const fetchedDeck = fetchedDecks.find(d => d.id === deckId);
        if (!fetchedDeck) { navigate('/dashboard'); return; }
        setDeck(fetchedDeck);
        // Filter cards for this deck
        const deckCards = allCards.filter((c: Card) => c.deckId === deckId);
        const due = deckCards.filter((c: Card) => c.nextReview <= Date.now());
        setStudyCards(due.length > 0 ? due : deckCards);
      } catch (err) {
        console.error('Failed to load study session:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (deckId) init();
  }, [deckId, navigate]);

  const spawnParticles = useCallback((x: number, y: number) => {
    const colors = ['#7C3AED', '#8B5CF6', '#3B82F6', '#A78BFA'];
    const newParticles = Array.from({ length: 12 }, () => ({
      id: particleId.current++,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))), 800);
  }, []);

  const currentCard = studyCards[index];

  const handleRate = useCallback(async (rating: Rating, event?: React.MouseEvent) => {
    if (!currentCard || !userId || isRating) return;
    setIsRating(true);
    if (event) {
      spawnParticles(event.clientX, event.clientY);
    } else {
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
    }
    try {
      const res = calculateSRS(currentCard, rating);
      await dbService.updateCard(currentCard.id, {
        interval: res.interval,
        repetition: res.repetition,
        easeFactor: res.easeFactor,
        nextReview: Date.now() + res.interval * 86400000,
        lastReviewed: Date.now(),
      });
    } catch (err) {
      console.error('Failed to update card:', err);
      // Continue anyway — don't block the user from finishing
    }
    setSessionStats(prev => ({
      correct: prev.correct + (rating >= Rating.GOOD ? 1 : 0),
      total: prev.total + 1,
    }));
    if (index >= studyCards.length - 1) {
      // Dispatch notification for study session completion
      const cardsReviewed = studyCards.length;
      addNotification({
        title: 'Study Session Complete!',
        description: `${deck?.title || 'Deck'} · ${cardsReviewed} cards reviewed`,
        type: 'success',
        actionUrl: '/dashboard',
        actionLabel: 'Dashboard',
      });
      toast.success('Study session complete!', {
        description: `${cardsReviewed} cards reviewed in ${deck?.title || 'deck'}`,
        duration: 5000,
      });
      setCompleted(true);
    } else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
    setIsRating(false);
  }, [currentCard, userId, index, studyCards.length, spawnParticles, isRating]);

  const handleTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !tiltEnabled) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * -12, y: (x - 0.5) * 12 });
  }, [tiltEnabled]);

  const resetTilt = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (sessionStats.total === 0) { setDisplayedXP(0); return; }
    const target = sessionStats.total * 10;
    let current = displayedXP;
    const step = Math.max(1, Math.floor((target - current) / 8));
    if (current >= target) return;
    const timer = setInterval(() => {
      current = Math.min(target, current + step);
      setDisplayedXP(current);
      if (current >= target) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStats.total]);

  const handleRestart = () => {
    setIndex(0); setFlipped(false); setCompleted(false);
    setSessionStats({ correct: 0, total: 0 });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); if (currentCard) setFlipped(f => !f); }
      if (flipped && currentCard) {
        const map: Record<string, Rating> = {
          'Digit1': Rating.AGAIN, 'Numpad1': Rating.AGAIN,
          'Digit2': Rating.HARD, 'Numpad2': Rating.HARD,
          'Digit3': Rating.GOOD, 'Numpad3': Rating.GOOD,
          'Digit4': Rating.EASY, 'Numpad4': Rating.EASY,
          'Slash': Rating.AGAIN,
        };
        const r = map[e.code] ?? map[e.key];
        if (r !== undefined) handleRate(r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, currentCard, handleRate, completed]);

  if (loading) return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="text-[#5A5A72] text-sm">Loading...</div></div>;

  if (completed) return <SessionComplete stats={sessionStats} deckTitle={deck?.title || ''} onRestart={handleRestart} onExit={() => navigate('/dashboard')} />;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col relative">
      <VideoBackground name="study-session" opacity={0.3} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A2A3A]/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="w-8 h-8 rounded-lg bg-[#111118] border border-[#2A2A3A] flex items-center justify-center text-[#5A5A72] hover:text-[#F0EFFE] transition-colors text-sm"
          ><X size={14} /></button>
          <span className="text-[#F0EFFE] text-sm font-medium">{deck?.title || 'Study'}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {studyCards.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i < index ? 'bg-emerald-500' : i === index ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'
              }`} />
            ))}
          </div>
          <span className="text-[#5A5A72] text-xs">{index + 1} / {studyCards.length}</span>
          <Zap size={14} className="text-amber-400" />
          <span className="text-amber-400 text-xs tabular-nums">{displayedXP}</span>
          <button className="w-7 h-7 rounded-lg bg-[#111118] border border-[#2A2A3A] flex items-center justify-center text-[#5A5A72] hover:text-[#F0EFFE] transition-colors text-xs">
            ↩
          </button>
        </div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: '50vw', y: '50vh', scale: 1, opacity: 1 }}
              animate={{ x: `calc(50vw + ${p.x}px)`, y: `calc(50vh + ${p.y}px)`, scale: 0, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute"
            >
              <Star size={10} fill={p.color} color={p.color} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center p-6" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        {/* Radial violet spotlight behind card */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-violet-500/8 via-violet-500/3 to-transparent pointer-events-none" style={{ filter: 'blur(60px)' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard?.id || 'empty'}
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -60, rotate: -3 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
            style={{ perspective: '800px' }}
          >
            {/* Stack effect — rotated cards behind */}
            <div
              className="flashcard-paper absolute inset-0 rounded-[8px]"
              style={{ transform: 'rotate(-3deg) translateY(14px)', opacity: 0.6, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
            />
            <div
              className="flashcard-paper absolute inset-0 rounded-[8px]"
              style={{ transform: 'rotate(2.5deg) translateY(7px)', opacity: 0.8, boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}
            />

            <div
              ref={cardRef}
              className="flashcard-paper relative w-[500px] max-w-[90vw] min-h-[340px] rounded-[8px] cursor-pointer select-none overflow-hidden transition-transform duration-75 ease-out"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotate(-1.5deg)`,
                boxShadow: '0 1px 0 0 #E8E4CC, 0 2px 0 0 #F5F0D8, 0 3px 0 0 #EDE8C8, 0 4px 6px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.35), 0 0 50px rgba(124,58,237,0.08)',
              }}
              onClick={() => currentCard && setFlipped(f => !f)}
            >
              {/* Red margin line */}
              <div aria-hidden className="absolute top-0 bottom-0" style={{ left: '44px', width: '1px', background: 'rgba(239, 68, 68, 0.28)' }} />

              <AnimatePresence mode="wait" initial={false}>
                {!flipped ? (
                  <motion.div
                    key="front"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="relative p-8 pt-12 pb-12 flex flex-col min-h-[340px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-[10px] uppercase font-medium text-[#8A8570] tracking-[0.15em] border-b border-[#D4CFA8] pb-1">
                        {deck?.title || 'STUDY'}
                      </div>
                      <div className="text-[10px] text-[#B8B09A]">{index + 1} / {studyCards.length}</div>
                    </div>
                    <div
                      className="relative flex-1 flex items-center justify-center mt-4"
                      style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #E8E3CC 31px, #E8E3CC 32px)' }}
                    >
                      <div
                        className="text-[#1A1828] font-medium text-center text-2xl"
                        style={{ lineHeight: '32px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {currentCard?.front || ''}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col items-center gap-0.5 text-[#B8B09A]">
                      <span className="text-xs">Tap to reveal</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="relative p-8 pt-12 pb-12 min-h-[340px]"
                  >
                    <div className="text-sm text-[#6B6550] border-b border-dashed border-[#D4CFA8] pb-1">
                      {currentCard?.front || ''}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-[#8A8570]">Answer</div>
                    <div className="mt-1 text-base font-medium text-[#1A1828] leading-snug">
                      {currentCard?.back || ''}
                    </div>
                    {currentCard?.citations && currentCard.citations.length > 0 && currentCard.sourceLabel && (
                      <div className="mt-3 text-xs text-[#6B6550] leading-relaxed">
                        <span className="font-semibold text-[#1A1828]">Source — </span>
                        {currentCard.sourceLabel}
                      </div>
                    )}
                    {currentCard?.verified && (
                      <div className="mt-2 rounded border border-[#D4CFA8] bg-[#FFF8E7] px-2 py-1 text-xs text-[#6B6550]">
                        <Lightbulb size={12} className="text-amber-700 inline mr-1" />
                        Verified by AI fact-check
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating bar */}
      <AnimatePresence>
        {flipped && currentCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="px-6 pb-6"
          >
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-3">
                <span className="text-[#5A5A72] text-[11px]">How well did you know this?</span>
              </div>
              <motion.div
                className="flex gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
                }}
              >
                {RATING_BTNS.map(btn => (
                  <motion.div
                    key={btn.label}
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
                    }}
                  >
                    <RatingButton {...btn} onRate={(r) => handleRate(r, undefined)} />
                  </motion.div>
                ))}
              </motion.div>
              <div className="text-center mt-2 flex items-center justify-center gap-1.5">
                <span className="text-[#3A3A4F] text-[10px]">Press</span>
                <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-[#2A2A3A] bg-[#1A1A24] text-[9px] font-mono text-[#5A5A72]">1</kbd>
                <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-[#2A2A3A] bg-[#1A1A24] text-[9px] font-mono text-[#5A5A72]">2</kbd>
                <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-[#2A2A3A] bg-[#1A1A24] text-[9px] font-mono text-[#5A5A72]">3</kbd>
                <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-[#2A2A3A] bg-[#1A1A24] text-[9px] font-mono text-[#5A5A72]">4</kbd>
                <span className="text-[#3A3A4F] text-[10px]">or</span>
                <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-[#2A2A3A] bg-[#1A1A24] px-1.5 text-[9px] font-mono text-[#5A5A72]">Space</kbd>
                <span className="text-[#3A3A4F] text-[10px]">to flip</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
