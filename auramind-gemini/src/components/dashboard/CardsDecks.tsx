import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BookOpen, Layers, Plus, Sparkles, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Send, FileText, Wand2, Zap } from 'lucide-react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { analyticsService } from '../../services/analytics/analyticsService';
import { generateDeckFromTopic, GeneratedCard } from '../../services/api/groqService';
import PageShell from './PageShell';

const CardsDecks: React.FC = () => {
  const { decks, cards, createDeck, deleteDeck, goToDeck, startStudyForDeck, addCardsToDeck } = useDashboardWorkspace();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  // Inline card creation
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);
  const questionRef = useRef<HTMLInputElement>(null);

  // AI generation
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('ai');
  const [aiTopic, setAiTopic] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGenTopic, setAiGenTopic] = useState('');
  const [isAiGenCards, setIsAiGenCards] = useState(false);
  const [aiGenSuccess, setAiGenSuccess] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  // Check if Groq API key is configured
  const hasAiKey = !!(import.meta as any).env?.VITE_GROQ_API_KEY &&
    !String((import.meta as any).env?.VITE_GROQ_API_KEY).includes('your_');

  const quizDecks = decks.filter(deck => 
    deck.title.includes('(Quiz)') || deck.description?.toLowerCase().includes('quiz')
  );
  const regularDecks = decks.filter(deck => 
    !deck.title.includes('(Quiz)') && !deck.description?.toLowerCase().includes('quiz')
  );

  // Focus question input when expanding a deck
  useEffect(() => {
    if (expandedDeckId && questionRef.current) {
      setTimeout(() => questionRef.current?.focus(), 150);
    }
  }, [expandedDeckId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim() || 'Untitled deck';
    const d = description.trim() || '';
    setError(null);
    setCreating(true);
    try {
      analyticsService.trackHeart('adoption', 'create_deck_submit', {
        hasDescription: Boolean(d),
        titleLength: t.length,
      });
      const deck = await createDeck(t, d);
      if (deck) {
        analyticsService.trackCoreAction('generate_deck', { source: 'cards_decks', deckId: deck.id });
        analyticsService.trackHeart('adoption', 'create_deck_success', { deckId: deck.id });
        setTitle('');
        setDescription('');
        setExpandedDeckId(deck.id);
      } else {
        analyticsService.trackHeart('task_success', 'create_deck_failed', { reason: 'null_deck' });
        setError('Could not create deck. Try again.');
      }
    } catch (err) {
      analyticsService.trackHeart('task_success', 'create_deck_failed', {
        reason: err instanceof Error ? err.message : 'unknown',
      });
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  };

  // AI: create deck + generate cards from topic
  const handleAiCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = aiTopic.trim();
    if (!topic || !addCardsToDeck) return;
    setError(null);
    setIsAiGenerating(true);
    try {
      analyticsService.trackHeart('adoption', 'ai_create_deck', { topic });
      // 1. AI generates the deck
      const generated = await generateDeckFromTopic(topic);
      // 2. Create the deck
      const deck = await createDeck(generated.title, generated.description);
      if (!deck) throw new Error('Could not create deck');
      // 3. Add all AI-generated cards
      if (generated.cards.length > 0) {
        await addCardsToDeck(deck.id, generated.cards.map((c: GeneratedCard) => ({
          question: c.question,
          answer: c.answer,
        })));
      }
      analyticsService.trackHeart('adoption', 'ai_create_deck_success', {
        deckId: deck.id,
        cardCount: generated.cards.length,
      });
      setAiTopic('');
      setExpandedDeckId(deck.id);
    } catch (err) {
      console.error('AI deck creation failed:', err);
      setError(err instanceof Error ? err.message : 'AI generation failed. Check your API key or try manually.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI: generate more cards for an existing deck
  const handleAiGenCards = async (e: React.FormEvent, deckId: string) => {
    e.preventDefault();
    const topic = aiGenTopic.trim();
    if (!topic || !addCardsToDeck) return;
    setIsAiGenCards(true);
    setAiGenError(null);
    setAiGenSuccess(false);
    try {
      const generated = await generateDeckFromTopic(topic);
      if (generated.cards.length > 0) {
        await addCardsToDeck(deckId, generated.cards.map((c: GeneratedCard) => ({
          question: c.question,
          answer: c.answer,
        })));
      }
      analyticsService.trackHeart('adoption', 'ai_gen_more_cards', { deckId, cardCount: generated.cards.length });
      setAiGenTopic('');
      setAiGenSuccess(true);
      setTimeout(() => setAiGenSuccess(false), 2500);
    } catch (err) {
      console.error('AI card generation failed:', err);
      setAiGenError(err instanceof Error ? err.message : 'Generation failed. Check your API key.');
    } finally {
      setIsAiGenCards(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent, deckId: string) => {
    e.preventDefault();
    if (!cardQuestion.trim() || !cardAnswer.trim() || !addCardsToDeck) return;
    setIsAddingCard(true);
    setCardSuccess(false);
    try {
      await addCardsToDeck(deckId, [{ question: cardQuestion.trim(), answer: cardAnswer.trim() }]);
      analyticsService.trackHeart('adoption', 'add_card_inline', { deckId });
      setCardQuestion('');
      setCardAnswer('');
      setCardSuccess(true);
      setTimeout(() => setCardSuccess(false), 1800);
      questionRef.current?.focus();
    } catch (err) {
      console.error('Failed to add card:', err);
    } finally {
      setIsAddingCard(false);
    }
  };

  const toggleExpand = (deckId: string) => {
    setExpandedDeckId(prev => prev === deckId ? null : deckId);
    setCardQuestion('');
    setCardAnswer('');
    setCardSuccess(false);
    setAiGenTopic('');
    setAiGenSuccess(false);
    setAiGenError(null);
  };

  const handleDeleteDeck = async () => {
    if (!deletingDeckId) return;
    try {
      analyticsService.trackHeart('engagement', 'delete_deck', { deckId: deletingDeckId });
      await deleteDeck(deletingDeckId);
    } catch (err) {
      console.error('Failed to delete deck:', err);
    } finally {
      setDeletingDeckId(null);
    }
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, deckId: string, cardCount: number) => {
      e.preventDefault();
      const menu = document.createElement('div');
      menu.className = 'fixed z-50 bg-[#111118] border border-[#2A2A3A] rounded-xl p-1 shadow-2xl min-w-[140px]';
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;

      const items = [
        { label: 'Open deck', action: () => goToDeck(deckId) },
        { label: 'Study', disabled: cardCount === 0, action: () => startStudyForDeck(deckId) },
        { label: 'Delete deck', danger: true, action: () => setDeletingDeckId(deckId) },
      ];

      items.forEach((item) => {
        const btn = document.createElement('button');
        btn.textContent = item.label;
        btn.className = `w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
          item.danger
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-[#9090A8] hover:bg-[#1A1A24] hover:text-[#F0EFFE]'
        } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`;
        if (!item.disabled) btn.onclick = () => { item.action(); menu.remove(); };
        menu.appendChild(btn);
      });

      const close = (ev: MouseEvent) => { if (!menu.contains(ev.target as Node)) { menu.remove(); document.removeEventListener('click', close); } };
      setTimeout(() => document.addEventListener('click', close), 0);

      document.body.appendChild(menu);
    },
    [goToDeck, startStudyForDeck],
  );

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[#F0EFFE] text-xl font-light tracking-tight flex items-center gap-3">
              <Layers className="h-6 w-6 text-[#8B5CF6]" />
              Library
            </h1>
            <p className="text-[#5A5A72] text-xs mt-1">
              Click a deck to add cards right here, or open it for the full editor.
            </p>
          </div>
          <button
            onClick={() => document.getElementById('create-deck-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          >
            <Plus size={14} />
            New deck
          </button>
        </div>

        {/* Empty state */}
        {decks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2A2A3A] bg-[#111118] p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <span className="inline-flex items-center gap-2 text-[10px] font-medium tracking-widest text-[#8B5CF6]">
                  <Sparkles className="h-4 w-4" />
                  First value in under a minute
                </span>
                <h2 className="text-lg font-medium text-[#F0EFFE]">You do not have any decks yet</h2>
                <p className="text-[#5A5A72] text-xs leading-relaxed max-w-xl">
                  Successful learning apps obsess over{' '}
                  <span className="text-[#9090A8]">first success</span>: one deck, a handful of cards, one short review.
                  Create a deck below — we send you straight into it so you can add cards immediately.
                </p>
                <ul className="space-y-1.5 text-xs text-[#5A5A72]">
                  <li className="flex gap-2">
                    <span className="text-[#8B5CF6]">›</span> Name a topic (e.g. &ldquo;Biochemistry — enzymes&rdquo;)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#8B5CF6]">›</span> Add 5 cards manually — or generate later from AI Chat
                  </li>
                </ul>
              </div>
              <div className="w-full lg:max-w-xs rounded-xl border border-[#2A2A3A] bg-[#1A1A24] p-5">
                <BookOpen className="h-6 w-6 text-[#8B5CF6] mb-3" />
                <p className="text-xs text-[#9090A8] leading-relaxed">
                  Pro tip: smaller decks with clear titles outperform giant catch-alls — they are easier to schedule and review.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quiz Decks */}
            {quizDecks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <h2 className="text-sm font-medium text-[#F0EFFE]">Quizzes</h2>
                  <span className="text-xs text-[#5A5A72]">{quizDecks.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {quizDecks.map((deck) => {
                    const n = cards.filter((c) => c.deckId === deck.id).length;
                    const due = cards.filter((c) => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                    const isExpanded = expandedDeckId === deck.id;
                    const deckCards = cards.filter((c) => c.deckId === deck.id).slice(0, 20);
                    return (
                      <div key={deck.id} onContextMenu={(e) => handleContextMenu(e, deck.id, n)}
                        className={isExpanded ? 'sm:col-span-2 xl:col-span-3' : ''}
                      >
                        <div
                          className={`rounded-xl border bg-[#111118] transition-all cursor-pointer ${isExpanded ? 'border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.08)]' : 'border-violet-500/25 hover:border-violet-500/40'}`}
                        >
                          {/* Deck header */}
                          <div className="p-5" onClick={() => toggleExpand(deck.id)}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 rounded-full">Quiz</span>
                                  {isExpanded && (
                                    <span className="text-[10px] text-violet-400/70 animate-pulse">editing cards…</span>
                                  )}
                                </div>
                                <h3 className="text-sm font-medium text-[#F0EFFE] mt-2 mb-1 line-clamp-2">{deck.title.replace(' (Quiz)', '')}</h3>
                                <p className="text-xs text-[#5A5A72] mb-1 line-clamp-2">{deck.description || 'No description'}</p>
                                <p className="text-[10px] text-[#5A5A72] tracking-wider">
                                  {n} question{n === 1 ? '' : 's'}
                                  {due > 0 && <span className="text-[#8B5CF6] ml-2">• {due} due</span>}
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpand(deck.id); }}
                                className="shrink-0 p-1.5 rounded-lg text-[#5A5A72] hover:text-[#F0EFFE] hover:bg-[#1A1A24] transition-all"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-[#2A2A3A]">
                              <button onClick={(e) => { e.stopPropagation(); startStudyForDeck(deck.id); }}
                                disabled={n === 0}
                                className="px-3 py-1.5 bg-[#7C3AED] text-white text-[11px] font-medium rounded-lg hover:bg-[#6D28D9] disabled:opacity-40 transition-all"
                              >Study</button>
                              <button onClick={(e) => { e.stopPropagation(); goToDeck(deck.id); }}
                                className="px-3 py-1.5 border border-[#2A2A3A] text-[#9090A8] text-[11px] font-medium rounded-lg hover:border-[#3A3A4F] hover:text-[#F0EFFE] transition-all"
                              >Open</button>
                            </div>
                          </div>

                          {/* Expanded: cards list + add-card form */}
                          {isExpanded && (
                            <div className="border-t border-violet-500/15 px-5 pb-5 space-y-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Existing cards */}
                              <div className="space-y-2">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">
                                  Cards ({n})
                                  {n > 20 && <span className="ml-1 text-[#5A5A72]">— showing first 20</span>}
                                </p>
                                {deckCards.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-[#2A2A3A] py-3 px-4 text-center">
                                    <p className="text-[11px] text-[#5A5A72]">
                                      No cards yet — add your first one below!
                                    </p>
                                  </div>
                                ) : (
                                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                    {deckCards.map((c, i) => (
                                      <div key={c.id || i} className="flex items-start gap-2 rounded-lg bg-[#1A1A24] px-3 py-2 text-xs">
                                        <FileText size={12} className="text-[#5A5A72] mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[#F0EFFE] truncate">{c.question || c.front}</p>
                                          <p className="text-[#5A5A72] truncate mt-0.5">{c.answer || c.back}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* AI: Generate more cards */}
                              {hasAiKey && (
                                <>
                                  <form onSubmit={(e) => handleAiGenCards(e, deck.id)} className="space-y-2">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#A855F7]">
                                      ⚡ AI: Generate cards about…
                                    </p>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={aiGenTopic}
                                        onChange={(e) => setAiGenTopic(e.target.value)}
                                        placeholder="e.g. Advanced integrals, WW2 causes…"
                                        className="flex-1 px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#A855F7]/20 text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#A855F7]/50 focus:outline-none transition-colors"
                                      />
                                      <button
                                        type="submit"
                                        disabled={isAiGenCards || !aiGenTopic.trim()}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-[10px] font-medium rounded-lg hover:from-[#6D28D9] hover:to-[#9333EA] disabled:opacity-40 transition-all"
                                      >
                                        {isAiGenCards ? (
                                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : aiGenSuccess ? (
                                          <>
                                            <CheckCircle2 size={12} />
                                            Cards added!
                                          </>
                                        ) : (
                                          <>
                                            <Wand2 size={12} />
                                            Generate
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    {aiGenError && (
                                      <p className="text-[10px] text-red-400">{aiGenError}</p>
                                    )}
                                  </form>

                                  {/* Divider */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-[#2A2A3A]" />
                                    <span className="text-[9px] text-[#5A5A72] uppercase tracking-wider">or manually</span>
                                    <div className="flex-1 h-px bg-[#2A2A3A]" />
                                  </div>
                                </>
                              )}

                              {/* Add card form */}
                              <form onSubmit={(e) => handleAddCard(e, deck.id)} className="space-y-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-[#7C3AED]">
                                  + Add a card
                                </p>
                                <input
                                  ref={expandedDeckId === deck.id ? questionRef : undefined}
                                  type="text"
                                  value={cardQuestion}
                                  onChange={(e) => setCardQuestion(e.target.value)}
                                  placeholder="Question or prompt…"
                                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors"
                                />
                                <textarea
                                  value={cardAnswer}
                                  onChange={(e) => setCardAnswer(e.target.value)}
                                  placeholder="Answer…"
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors resize-none"
                                />
                                <button
                                  type="submit"
                                  disabled={isAddingCard || !cardQuestion.trim() || !cardAnswer.trim()}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
                                    cardSuccess
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                                  } disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
                                >
                                  {isAddingCard ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Saving…
                                    </>
                                  ) : cardSuccess ? (
                                    <>
                                      <CheckCircle2 size={14} />
                                      Card saved!
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} />
                                      Add card
                                    </>
                                  )}
                                </button>
                              </form>

                              {/* View all link */}
                              {n > 20 && (
                                <button
                                  onClick={() => goToDeck(deck.id)}
                                  className="w-full text-center text-[10px] text-[#8B5CF6] hover:text-violet-400 transition-colors py-1"
                                >
                                  View all {n} cards →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Regular Decks */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-[#8B5CF6]" />
                <h2 className="text-sm font-medium text-[#F0EFFE]">Decks</h2>
                <span className="text-xs text-[#5A5A72]">{regularDecks.length} deck{regularDecks.length === 1 ? '' : 's'}</span>
              </div>
              {regularDecks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2A2A3A] bg-[#111118] p-8 text-center">
                  <p className="text-[#5A5A72] text-xs">No decks yet. Create one below!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {regularDecks.map((deck) => {
                    const n = cards.filter((c) => c.deckId === deck.id).length;
                    const due = cards.filter((c) => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                    const isExpanded = expandedDeckId === deck.id;
                    const deckCards = cards.filter((c) => c.deckId === deck.id).slice(0, 20);
                    return (
                      <div key={deck.id} onContextMenu={(e) => handleContextMenu(e, deck.id, n)}
                        className={isExpanded ? 'sm:col-span-2 xl:col-span-3' : ''}
                      >
                        <div
                          className={`rounded-xl border bg-[#111118] transition-all cursor-pointer ${isExpanded ? 'border-[#7C3AED]/40 shadow-[0_0_30px_rgba(124,58,237,0.08)]' : 'border-[#2A2A3A] hover:border-[#3A3A4F]'}`}
                        >
                          {/* Deck header */}
                          <div className="p-5" onClick={() => toggleExpand(deck.id)}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-medium text-[#F0EFFE] line-clamp-1">{deck.title}</h3>
                                  {isExpanded && (
                                    <span className="text-[10px] text-violet-400/70 animate-pulse">editing cards…</span>
                                  )}
                                </div>
                                {deck.description && (
                                  <p className="text-xs text-[#5A5A72] mb-1 line-clamp-2 mt-0.5">{deck.description}</p>
                                )}
                                <p className="text-[10px] text-[#5A5A72] tracking-wider">
                                  {n} card{n === 1 ? '' : 's'}
                                  {due > 0 && <span className="text-[#8B5CF6] ml-2">• {due} due</span>}
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpand(deck.id); }}
                                className="shrink-0 p-1.5 rounded-lg text-[#5A5A72] hover:text-[#F0EFFE] hover:bg-[#1A1A24] transition-all"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-[#2A2A3A]">
                              <button onClick={(e) => { e.stopPropagation(); startStudyForDeck(deck.id); }}
                                disabled={n === 0}
                                className="px-3 py-1.5 bg-[#7C3AED] text-white text-[11px] font-medium rounded-lg hover:bg-[#6D28D9] disabled:opacity-40 transition-all"
                              >Study</button>
                              <button onClick={(e) => { e.stopPropagation(); goToDeck(deck.id); }}
                                className="px-3 py-1.5 border border-[#2A2A3A] text-[#9090A8] text-[11px] font-medium rounded-lg hover:border-[#3A3A4F] hover:text-[#F0EFFE] transition-all"
                              >Open</button>
                            </div>
                          </div>

                          {/* Expanded: cards list + add-card form */}
                          {isExpanded && (
                            <div className="border-t border-[#7C3AED]/15 px-5 pb-5 space-y-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Existing cards */}
                              <div className="space-y-2">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">
                                  Cards ({n})
                                  {n > 20 && <span className="ml-1 text-[#5A5A72]">— showing first 20</span>}
                                </p>
                                {deckCards.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-[#2A2A3A] py-3 px-4 text-center">
                                    <p className="text-[11px] text-[#5A5A72]">
                                      No cards yet — add your first one below!
                                    </p>
                                  </div>
                                ) : (
                                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                    {deckCards.map((c, i) => (
                                      <div key={c.id || i} className="flex items-start gap-2 rounded-lg bg-[#1A1A24] px-3 py-2 text-xs">
                                        <FileText size={12} className="text-[#5A5A72] mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[#F0EFFE] truncate">{c.question || c.front}</p>
                                          <p className="text-[#5A5A72] truncate mt-0.5">{c.answer || c.back}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Add card form */}
                              <form onSubmit={(e) => handleAddCard(e, deck.id)} className="space-y-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-[#7C3AED]">
                                  + Add a card
                                </p>
                                <input
                                  ref={expandedDeckId === deck.id ? questionRef : undefined}
                                  type="text"
                                  value={cardQuestion}
                                  onChange={(e) => setCardQuestion(e.target.value)}
                                  placeholder="Question or prompt…"
                                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors"
                                />
                                <textarea
                                  value={cardAnswer}
                                  onChange={(e) => setCardAnswer(e.target.value)}
                                  placeholder="Answer…"
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors resize-none"
                                />
                                <button
                                  type="submit"
                                  disabled={isAddingCard || !cardQuestion.trim() || !cardAnswer.trim()}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
                                    cardSuccess
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                                  } disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
                                >
                                  {isAddingCard ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Saving…
                                    </>
                                  ) : cardSuccess ? (
                                    <>
                                      <CheckCircle2 size={14} />
                                      Card saved!
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} />
                                      Add card
                                    </>
                                  )}
                                </button>
                              </form>

                              {/* View all link */}
                              {n > 20 && (
                                <button
                                  onClick={() => goToDeck(deck.id)}
                                  className="w-full text-center text-[10px] text-[#8B5CF6] hover:text-violet-400 transition-colors py-1"
                                >
                                  View all {n} cards →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Deck Panel */}
        <section id="create-deck-panel" className="scroll-mt-28">
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-sm font-medium text-[#F0EFFE]">Create a deck</h2>
              {/* Mode toggle */}
              <div className="flex rounded-lg bg-[#1A1A24] border border-[#2A2A3A] p-0.5">
                <button
                  onClick={() => setCreationMode('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    creationMode === 'ai'
                      ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.25)]'
                      : 'text-[#5A5A72] hover:text-[#9090A8]'
                  }`}
                >
                  <Wand2 size={12} />
                  AI Magic
                </button>
                <button
                  onClick={() => setCreationMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    creationMode === 'manual'
                      ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.25)]'
                      : 'text-[#5A5A72] hover:text-[#9090A8]'
                  }`}
                >
                  <FileText size={12} />
                  Manual
                </button>
              </div>
            </div>

            {creationMode === 'ai' ? (
              /* ── AI Magic Mode ── */
              <div>
                {!hasAiKey ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                    <p className="text-xs text-amber-400/90 leading-relaxed">
                      <strong>Groq API key required.</strong> Set <code className="bg-amber-500/10 px-1 rounded text-[10px]">VITE_GROQ_API_KEY</code> in your <code className="bg-amber-500/10 px-1 rounded text-[10px]">.env</code> file.{' '}
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline hover:text-amber-300">Get a free key →</a>
                    </p>
                    <button onClick={() => setCreationMode('manual')} className="text-[10px] text-amber-400/70 hover:text-amber-300 mt-2 transition-colors">
                      ← Switch to manual mode
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#5A5A72] mb-5">
                      Describe what you want to learn — AI creates the deck and 8–12 cards instantly.
                    </p>
                    <form onSubmit={handleAiCreate} className="space-y-4 max-w-lg">
                      <div>
                        <label htmlFor="ai-topic" className="block text-xs font-medium text-[#9090A8] mb-1.5">
                          What do you want to study?
                        </label>
                        <input
                          id="ai-topic"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g. Photosynthesis, React Hooks, French Revolution, Calculus derivatives…"
                          className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#7C3AED]/30 text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/60 focus:outline-none transition-colors"
                        />
                      </div>
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <button
                        type="submit"
                        disabled={isAiGenerating || !aiTopic.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-medium rounded-lg hover:from-[#6D28D9] hover:to-[#9333EA] disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(124,58,237,0.3)]"
                      >
                        {isAiGenerating ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating deck…
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            Generate deck with AI
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* ── Manual Mode ── */
              <div>
                <p className="text-xs text-[#5A5A72] mb-5">
                  Titles are searchable from the top bar — pick something you will recognize in three months.
                </p>
                <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                  <div>
                    <label htmlFor="deck-title" className="block text-xs font-medium text-[#9090A8] mb-1.5">Title</label>
                    <input
                      id="deck-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Organic chemistry — nomenclature"
                      className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="deck-desc" className="block text-xs font-medium text-[#9090A8] mb-1.5">
                      Description <span className="text-[#5A5A72] font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="deck-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What will you memorize here?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] text-[#F0EFFE] text-xs placeholder-[#5A5A72] focus:border-[#7C3AED]/50 focus:outline-none transition-colors resize-y min-h-[80px]"
                    />
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button type="submit" disabled={creating}
                    className="px-5 py-2 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                  >
                    {creating ? 'Creating…' : 'Create & add cards'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Delete Confirmation */}
        {deletingDeckId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingDeckId(null)}>
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#F0EFFE]">Delete deck?</h3>
                  <p className="text-xs text-[#5A5A72] mt-1">
                    Permanently delete this deck and all its cards. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeletingDeckId(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#1A1A24] text-[#9090A8] text-xs font-medium hover:text-[#F0EFFE] transition-colors"
                >Cancel</button>
                <button onClick={handleDeleteDeck}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                >Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default CardsDecks;
