import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/shared/GlassCard';
import PageShell from '../../components/dashboard/PageShell';
import ChatQuiz from '../../components/chat/ChatQuiz';
import { auraAiClient } from '../../services/api/auraAiService';
import { dbService } from '../../services/database/dbService';
import { useCurrentUserId } from '../../hooks/useCurrentUserId';
import { Quiz, Deck, Card } from '../../types';
import {
  BrainCircuitIcon as BrainCircuit,
  LayersIcon as Layers,
  TargetIcon as Target,
  SparklesIcon as Sparkles,
  RotateCcwIcon as RotateCcw,
  ChevronLeftIcon as ChevronLeft,
  ZapIcon as Zap,
  PlayIcon as Play,
  XIcon as X,
} from '../../components/icons/CustomIcons';

interface QuizDeck extends Deck {
  cards: Card[];
}

interface SavedQuiz extends Quiz {
  savedAt: number;
}

const QuizPage: React.FC = () => {
  const [decks, setDecks] = useState<QuizDeck[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<QuizDeck | null>(null);
  const [selectedSaved, setSelectedSaved] = useState<SavedQuiz | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<{ deckId: string; score: number; total: number }[]>([]);
  const userId = useCurrentUserId();

  useEffect(() => {
    const raw = localStorage.getItem('auramind-saved-quizzes');
    if (raw) {
      try { setSavedQuizzes(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    if (userId === null) { setLoading(false); return; }
    (async () => {
      try {
        const allDecks = await dbService.fetchDecks(userId);
        const allCards = await dbService.fetchCards(userId);
        if (cancelled) return;
        const grouped = allDecks.map(d => ({
          ...d,
          cards: allCards.filter(c => c.deckId === d.id),
        })).filter(d => d.cards.length > 0);
        setDecks(grouped);
      } catch (err) {
        if (!cancelled) setError('Failed to load decks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleGenerateQuiz = async (deck: QuizDeck) => {
    setSelectedDeck(deck);
    setGenerating(true);
    setQuiz(null);
    try {
      const content = deck.cards.map(c => `Q: ${c.front}\nA: ${c.back}`).join('\n\n');
      const response = await auraAiClient.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a quiz generator. Return ONLY valid JSON.' },
          { role: 'user', content: `Generate a quiz with 5-8 multiple choice questions based on this content. Return JSON with format: { "id": string, "title": string, "topic": string, "difficulty": "easy"|"medium"|"hard", "questions": [{ "id": string, "question": string, "options": string[], "correctAnswer": number, "explanation": string }] }\n\nContent:\n${content}` }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });
      const rawContent = response.choices?.[0]?.message?.content || '';
      if (!rawContent.trim()) throw new Error('Empty response');
      const parsed = JSON.parse(rawContent);
      setQuiz(parsed);
    } catch (err) {
      setError('Failed to generate quiz. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = (score: number, total: number) => {
    const id = selectedDeck?.id || selectedSaved?.id || 'saved';
    setCompletedSessions(prev => [...prev, { deckId: id, score, total }]);
  };

  const handleBack = () => {
    setSelectedDeck(null);
    setSelectedSaved(null);
    setQuiz(null);
    setError(null);
  };

  const sessionHistory = useMemo(() => {
    const id = selectedDeck?.id || selectedSaved?.id || '';
    if (!id) return [];
    return completedSessions.filter(s => s.deckId === id);
  }, [completedSessions, selectedDeck, selectedSaved]);

  if (loading) {
    return (
      <PageShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
      </PageShell>
    );
  }

  // Quiz taking view
  const activeQuiz = quiz || selectedSaved;
  if (activeQuiz && (selectedDeck || selectedSaved)) {
    return (
      <PageShell>
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to {selectedSaved ? 'saved quizzes' : 'decks'}
        </button>
        <ChatQuiz quiz={activeQuiz} onComplete={handleComplete} />
        {sessionHistory.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium mb-2">Previous sessions</p>
            <div className="flex gap-2">
              {sessionHistory.map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                  {s.score}/{s.total} ({Math.round(s.score / s.total * 100)}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      </PageShell>
    );
  }

  // Generating view
  if (generating && selectedDeck) {
    return (
      <PageShell>
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to decks
        </button>
        <GlassCard variant="neural" className="border-primary/25">
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full" />
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-100 mb-1">Generating Quiz</p>
              <p className="text-sm text-zinc-500">Creating questions from "{selectedDeck.title}"...</p>
            </div>
          </div>
        </GlassCard>
      </div>
      </PageShell>
    );
  }

  const handleStartSavedQuiz = (q: SavedQuiz) => {
    setSelectedSaved(q);
    setQuiz(q);
  };

  const handleDeleteSavedQuiz = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedQuizzes.filter(q => q.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem('auramind-saved-quizzes', JSON.stringify(updated));
  };

  // Main deck selection view
  return (
    <PageShell>
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-violet-500/10 rounded-xl">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Quiz Lab</h1>
            <p className="text-sm text-zinc-500">Generate practice quizzes from any deck</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {savedQuizzes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Saved Quizzes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedQuizzes.map((q) => (
              <motion.button
                key={q.id}
                onClick={() => handleStartSavedQuiz(q)}
                className="text-left group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard variant="neural" className="border-emerald-500/20 h-full hover:border-emerald-500/40 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteSavedQuiz(e, q.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1 group-hover:text-emerald-300 transition-colors">{q.title}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{q.topic} &middot; {q.difficulty} &middot; {q.questions.length} questions</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Play className="w-3 h-3" /> Start Quiz
                    </span>
                  </div>
                </GlassCard>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">From Decks</h2>
        {decks.length === 0 ? (
          <GlassCard variant="neural" className="border-primary/25">
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Target className="w-12 h-12 text-zinc-600" />
              <p className="text-zinc-400">No decks found. Create a deck first to generate quizzes.</p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => {
              const pastSessions = completedSessions.filter(s => s.deckId === deck.id);
              return (
                <motion.button
                  key={deck.id}
                  onClick={() => handleGenerateQuiz(deck)}
                  className="text-left group"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard variant="neural" className="border-primary/20 h-full hover:border-violet-500/40 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                        <Zap className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-xs text-zinc-500">{deck.cardCount} cards</span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 mb-1 group-hover:text-violet-300 transition-colors">{deck.title}</h3>
                    {deck.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{deck.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Play className="w-3 h-3" /> Start Quiz
                      </span>
                      {pastSessions.length > 0 && (
                        <span className="text-[10px] text-emerald-400/60">
                          Best: {Math.max(...pastSessions.map(s => Math.round(s.score / s.total * 100)))}%
                        </span>
                      )}
                    </div>
                  </GlassCard>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PageShell>
  );
};

export default QuizPage;



