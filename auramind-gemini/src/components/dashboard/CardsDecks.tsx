import React, { useState, useCallback } from 'react';
import { BookOpenIcon as BookOpen, LayersIcon as Layers, PlusIcon as Plus, SparklesIcon, PlayIcon as Play, ExternalLinkIcon as ExternalLink, Trash2Icon as Trash2, AlertTriangleIcon as AlertTriangle } from '../icons/CustomIcons';
import GlassCard from '../shared/GlassCard';
import { useContextMenu } from '../ui/ContextMenu';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { analyticsService } from '../../services/analytics/analyticsService';

const CardsDecks: React.FC = () => {
  const { decks, cards, createDeck, deleteDeck, goToDeck, startStudyForDeck } = useDashboardWorkspace();
  const { showContextMenu, ContextMenuComponent } = useContextMenu();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  // Separate quiz decks from regular decks
  const quizDecks = decks.filter(deck => 
    deck.title.includes('(Quiz)') || deck.description?.toLowerCase().includes('quiz')
  );
  const regularDecks = decks.filter(deck => 
    !deck.title.includes('(Quiz)') && !deck.description?.toLowerCase().includes('quiz')
  );

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
        goToDeck(deck.id);
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
      showContextMenu(e, [
        {
          id: 'open',
          label: 'Open deck',
          icon: ExternalLink,
          action: () => goToDeck(deckId),
        },
        {
          id: 'study',
          label: 'Study',
          icon: Play,
          disabled: cardCount === 0,
          action: () => startStudyForDeck(deckId),
        },
        {
          id: 'delete',
          label: 'Delete deck',
          icon: Trash2,
          danger: true,
          action: () => setDeletingDeckId(deckId),
        },
      ]);
    },
    [goToDeck, startStudyForDeck, showContextMenu]
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <ContextMenuComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <Layers className="w-9 h-9 text-primary shrink-0" aria-hidden />
            Cards & decks
          </h1>
          <p className="text-zinc-500 mt-2 max-w-xl">
            Your library — open a deck to edit cards, or jump into study. Empty states are temporary; every power user started here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            document.getElementById('create-deck-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden />
          New deck
        </button>
      </div>

      {decks.length === 0 ? (
        <GlassCard variant="neural" className="border-dashed border-primary/30 bg-primary/[0.02]">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-mono-label uppercase tracking-widest text-primary/80">
                <SparklesIcon className="w-4 h-4" aria-hidden />
                First value in under a minute
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">You do not have any decks yet</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Successful learning apps obsess over{' '}
                <strong className="text-zinc-800 dark:text-zinc-200">first success</strong>: one deck, a handful of cards, one short review.
                Create a deck below — we send you straight into it so you can add cards immediately.
              </p>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-500">
                <li className="flex gap-2">
                  <span className="text-primary">›</span> Name a topic (e.g. "Biochemistry — enzymes")
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">›</span> Add 5 cards manually — or generate later from AI Chat
                </li>
              </ul>
            </div>
            <GlassCard variant="bordered" className="w-full lg:max-w-sm border-primary/25 bg-zinc-950/80">
              <BookOpen className="w-8 h-8 text-primary mb-3" aria-hidden />
              <p className="text-sm text-zinc-400">
                Pro tip: smaller decks with clear titles outperform giant catch-alls — they are easier to schedule and review.
              </p>
            </GlassCard>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Quiz Section */}
          {quizDecks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-violet-500" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Quizzes</h2>
                <span className="text-sm text-zinc-600 dark:text-zinc-500">{quizDecks.length} quiz{quizDecks.length === 1 ? '' : 'es'}</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {quizDecks.map((deck) => {
                  const n = cards.filter((c) => c.deckId === deck.id).length;
                  const due = cards.filter((c) => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                  return (
                    <div
                      key={deck.id}
                      onContextMenu={(e) => handleContextMenu(e, deck.id, n)}
                    >
                      <GlassCard
                        variant="neural"
                        className="flex flex-col h-full hover:border-violet-500/40 transition-colors border-violet-500/25 cursor-pointer"
                      >
                        <div className="flex-1" onClick={() => goToDeck(deck.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDeck(deck.id); } }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 rounded-full">Quiz</span>
                          </div>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 line-clamp-2">{deck.title.replace(' (Quiz)', '')}</h3>
                          <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{deck.description || 'No description'}</p>
                          <p className="text-xs text-zinc-500 font-mono-label uppercase tracking-wider">
                            {n} question{n === 1 ? '' : 's'}
                            {due > 0 && (
                              <span className="text-primary ml-2">
                                • {due} due
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-primary/10">
                          <button
                            type="button"
                            disabled={n === 0}
                            onClick={() => startStudyForDeck(deck.id)}
                            className="px-3 py-2 rounded-lg bg-violet-600 text-black text-sm font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            Study
                          </button>
                          <button
                            type="button"
                            onClick={() => goToDeck(deck.id)}
                            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm hover:border-violet-500/50 hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            Open
                          </button>
                        </div>
                      </GlassCard>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Decks Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Decks</h2>
              <span className="text-sm text-zinc-600 dark:text-zinc-500">{regularDecks.length} deck{regularDecks.length === 1 ? '' : 's'}</span>
            </div>
            {regularDecks.length === 0 ? (
              <GlassCard variant="bordered" className="border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50">
                <p className="text-zinc-500 text-center py-8">No decks yet. Create one below!</p>
              </GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {regularDecks.map((deck) => {
                  const n = cards.filter((c) => c.deckId === deck.id).length;
                  const due = cards.filter((c) => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                  return (
                    <div
                      key={deck.id}
                      onContextMenu={(e) => handleContextMenu(e, deck.id, n)}
                    >
                      <GlassCard
                        variant="neural"
                        className="flex flex-col h-full hover:border-primary/40 transition-colors border-primary/25 cursor-pointer"
                      >
                        <div className="flex-1" onClick={() => goToDeck(deck.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDeck(deck.id); } }}>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 line-clamp-2">{deck.title}</h3>
                          <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{deck.description || 'No description'}</p>
                          <p className="text-xs text-zinc-500 font-mono-label uppercase tracking-wider">
                            {n} card{n === 1 ? '' : 's'}
                            {due > 0 && (
                              <span className="text-primary ml-2">
                                • {due} due
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-primary/10">
                          <button
                            type="button"
                            disabled={n === 0}
                            onClick={() => startStudyForDeck(deck.id)}
                            className="px-3 py-2 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            Study
                          </button>
                          <button
                            type="button"
                            onClick={() => goToDeck(deck.id)}
                            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            Open
                          </button>
                        </div>
                      </GlassCard>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <section id="create-deck-panel" className="scroll-mt-28">
        <GlassCard variant="bordered" className="border-primary/25">
          <h2 className="text-xl font-bold text-primary mb-2">Create a deck</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Titles are searchable from the top bar — pick something you will recognize in three months.
          </p>
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="deck-title" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Title
              </label>
              <input
                id="deck-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Organic chemistry — nomenclature"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="deck-desc" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Description{' '}
                <span className="text-zinc-500 dark:text-zinc-600 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                id="deck-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you memorize here?"
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[88px]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {creating ? 'Creating…' : 'Create & open deck'}
            </button>
          </form>
        </GlassCard>
      </section>

      {deletingDeckId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingDeckId(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete deck?</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  This will permanently delete this deck and all its cards. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingDeckId(null)}
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeck}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsDecks;



