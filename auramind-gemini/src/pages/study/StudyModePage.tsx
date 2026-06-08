import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon as ArrowLeft, RotateCwIcon as RotateCw, CheckCircle2Icon as CheckCircle2, XCircleIcon as XCircle, AlertCircleIcon as AlertCircle, BrainIcon as Brain } from '../../components/icons/CustomIcons';
import GlassCard from '../../components/shared/GlassCard';
import { dbService } from '../../services/database/dbService';
import { supabase } from '../../services/database/supabase';
import { calculateSRS } from '../../services/study/srs';
import { Rating } from '../../types';
import type { Card, Deck } from '../../types';

const RATING_BUTTONS: { label: string; rating: Rating; color: string; icon: React.ReactNode }[] = [
  { label: 'Again', rating: Rating.AGAIN, color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25', icon: <XCircle className="w-5 h-5" /> },
  { label: 'Hard', rating: Rating.HARD, color: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25', icon: <AlertCircle className="w-5 h-5" /> },
  { label: 'Good', rating: Rating.GOOD, color: 'bg-green-500/15 text-green-400 hover:bg-green-500/25', icon: <CheckCircle2 className="w-5 h-5" /> },
  { label: 'Easy', rating: Rating.EASY, color: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25', icon: <Brain className="w-5 h-5" /> },
];

export default function StudyModePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (!deckId) return;
    let cancelled = false;

    const run = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = data?.user?.id || null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }
      const decks = await dbService.fetchDecks(uid);
      if (cancelled) return;
      const found = decks.find((d) => d.id === deckId);
      if (cancelled) return;
      setDeck(found || null);
      const allCards = await dbService.fetchCards(uid);
      if (cancelled) return;
      const deckCards = allCards
        .filter((c) => c.deckId === deckId)
        .sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
      setCards(deckCards);
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [deckId]);

  const currentCard = cards[index];

  const handleRate = async (rating: Rating) => {
    if (!currentCard || !userId) return;
    const result = calculateSRS(currentCard, rating);
    await dbService.updateCard(currentCard.id, {
      nextReview: Date.now() + result.interval * 86400000,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetition: result.repetition,
      lastReviewed: Date.now(),
      ...(result.fsrsState ? { fsrsState: result.fsrsState } : {}),
    });
    const newCorrect = sessionStats.correct + (rating >= 4 ? 1 : 0);
    const newTotal = sessionStats.total + 1;
    setSessionStats({ correct: newCorrect, total: newTotal });
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setCompleted(true);
      await dbService.saveStudySession({
        userId,
        deckId,
        startTime: sessionStart.current,
        endTime: Date.now(),
        cardsStudied: cards.length,
        correctAnswers: newCorrect,
        totalAnswers: newTotal,
        accuracy: Math.round((newCorrect / newTotal) * 100),
        duration: Math.round((Date.now() - sessionStart.current) / 1000),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <p className="text-zinc-500">Loading study session…</p>
      </div>
    );
  }

if (!deck) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="text-center space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Deck not found</p>
          <button onClick={() => navigate('/dashboard/decks')} className="text-primary hover:underline text-sm">
            Back to decks
          </button>
        </div>
      </div>
    );
  }

if (completed) {
    const acc = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <GlassCard variant="neural" className="max-w-md w-full text-center">
          <div className="py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Session complete!</h1>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/50">
                <p className="text-2xl font-bold text-primary">{acc}%</p>
                <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50">
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{sessionStats.total}</p>
                <p className="text-xs text-zinc-500 mt-1">Cards reviewed</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setIndex(0); setFlipped(false); setCompleted(false); setSessionStats({ correct: 0, total: 0 }); sessionStart.current = Date.now(); }}
                className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
              >
                Study again
              </button>
              <button
                onClick={() => navigate(`/deck/${deckId}`)}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-primary/50 hover:text-primary"
              >
                Back to deck
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <GlassCard variant="neural" className="max-w-md w-full text-center">
          <div className="py-8 space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">No cards in this deck</p>
            <button onClick={() => navigate(`/deck/${deckId}`)} className="text-primary hover:underline text-sm">
              Add cards
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-zinc-950" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/deck/${deckId}`)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {deck.title}
          </button>
          <span className="text-sm text-zinc-500 font-mono">
            {index + 1} / {cards.length}
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((index) / cards.length) * 100}%` }}
          />
        </div>

        <div
          onClick={() => setFlipped(!flipped)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(prev => !prev); } }}
          role="button"
          tabIndex={0}
          className="cursor-pointer"
        >
          {!flipped ? (
            <GlassCard variant="neural" className="min-h-[300px] flex flex-col">
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-xl text-zinc-900 dark:text-white text-center leading-relaxed">{(currentCard as any).front || (currentCard as any).question}</p>
              </div>
              <div className="text-center pb-6">
                <span className="text-xs text-zinc-600 flex items-center justify-center gap-2">
                  <RotateCw className="w-3 h-3" />
                  Tap to reveal answer
                </span>
              </div>
            </GlassCard>
          ) : (
            <GlassCard variant="neural" className="min-h-[300px] flex flex-col border-primary/30">
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-xl text-zinc-900 dark:text-white text-center leading-relaxed">{(currentCard as any).back || (currentCard as any).answer}</p>
              </div>
            </GlassCard>
          )}
        </div>

        {flipped && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            {RATING_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleRate(btn.rating)}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl font-medium transition-all ${btn.color}`}
              >
                {btn.icon}
                <span className="text-sm">{btn.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}



