import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SourceDocumentsProvider, useSourceDocuments } from '../../contexts/SourceDocumentsContext';
import AIChat from '../dashboard/AIChat';
import SourcesPanel from './SourcesPanel';
import { SparklesIcon as Sparkles, FileTextIcon as FileText, XIcon as X } from '../icons/CustomIcons';
import { generateQuizFromSources, generateFlashcardsFromSources } from '../../services/generation/sourceGroundedService';
import NotebookLMQuiz from './NotebookLMQuiz';
import NotebookLMFlashcardDeck from './NotebookLMFlashcardDeck';
import { SourceGroundedCard } from '../../types';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { useNavigate } from 'react-router-dom';

interface GenerationState {
  type: 'quiz' | 'flashcards';
  data: any;
  isLoading: boolean;
  error: string | null;
}

const ChatWithSources: React.FC = () => {
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const { sources, activeSourceIds } = useSourceDocuments();

  const handleGenerateQuiz = useCallback(async () => {
    if (activeSourceIds.length === 0) return;
    setGenerationState({ type: 'quiz', data: null, isLoading: true, error: null });
    try {
      const quiz = await generateQuizFromSources(sources, activeSourceIds, 'document content', {
        difficulty: 'medium',
        count: 5,
      });
      setGenerationState({ type: 'quiz', data: quiz, isLoading: false, error: null });
    } catch (err) {
      setGenerationState({ type: 'quiz', data: null, isLoading: false, error: err instanceof Error ? err.message : 'Generation failed' });
    }
  }, [sources, activeSourceIds]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (activeSourceIds.length === 0) return;
    setGenerationState({ type: 'flashcards', data: null, isLoading: true, error: null });
    try {
      const cards = await generateFlashcardsFromSources(sources, activeSourceIds, 'document content', {
        difficulty: 'medium',
        count: 8,
      });
      setGenerationState({ type: 'flashcards', data: cards, isLoading: false, error: null });
    } catch (err) {
      setGenerationState({ type: 'flashcards', data: null, isLoading: false, error: err instanceof Error ? err.message : 'Generation failed' });
    }
  }, [sources, activeSourceIds]);

  const clearGeneration = useCallback(() => {
    setGenerationState(null);
  }, []);

  const { createDeck, addCardsToDeck } = useDashboardWorkspace();
  const navigate = useNavigate();

  const handleSaveCards = useCallback(async (cards: SourceGroundedCard[], deckTitle: string) => {
    if (!createDeck || !addCardsToDeck) return;
    try {
      const deck = await createDeck(deckTitle, `Generated from ${activeSourceIds.length} source document${activeSourceIds.length > 1 ? 's' : ''}`);
      if (deck) {
        await addCardsToDeck(deck.id, cards.map(c => ({ question: c.question, answer: c.answer })));
        clearGeneration();
        navigate(`/deck/${deck.id}`);
      }
    } catch (err) {
      console.error('[SourceGrounded] Failed to save cards:', err);
    }
  }, [createDeck, addCardsToDeck, activeSourceIds.length, clearGeneration, navigate]);

  return (
    <div className="flex h-full relative">
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 relative">
        <AIChat />
      </div>

      {/* Sources Toggle Button (when panel closed) */}
      <AnimatePresence>
        {sources.length > 0 && !sourcesPanelOpen && (
          <motion.button
            key="sources-toggle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setSourcesPanelOpen(true)}
            className="absolute top-4 right-4 z-40 p-3 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-violet-500/30 transition-all shadow-lg backdrop-blur-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={18} />
            <span className="block text-[8px] font-black uppercase tracking-widest text-violet-400 mt-0.5">
              {sources.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sources Panel */}
      <AnimatePresence>
        {sourcesPanelOpen && (
          <SourcesPanel
            onGenerateQuiz={handleGenerateQuiz}
            onGenerateFlashcards={handleGenerateFlashcards}
            isGenerating={generationState?.isLoading}
          />
        )}
      </AnimatePresence>

      {/* Generation Overlay */}
      <AnimatePresence>
        {generationState && (
          <motion.div
            key="generation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            {generationState.isLoading ? (
              <motion.div
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-violet-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Generating {generationState.type === 'quiz' ? 'Quiz' : 'Flashcards'}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Analyzing {activeSourceIds.length} source document{activeSourceIds.length > 1 ? 's' : ''}...
                    </p>
                  </div>
                </div>
                <div className="mt-4 w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            ) : generationState.error ? (
              <motion.div className="p-4 rounded-2xl bg-red-900/40 border border-red-800/50 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-300">{generationState.error}</p>
                  <button onClick={clearGeneration} className="p-1 hover:bg-red-800/30 rounded text-red-400">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                {/* Generation Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Generated from {activeSourceIds.length} source{activeSourceIds.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={clearGeneration}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                  {generationState.type === 'quiz' && generationState.data && (
                    <NotebookLMQuiz
                      title={generationState.data.title || 'Quiz from Sources'}
                      questions={generationState.data.questions || []}
                    />
                  )}
                  {generationState.type === 'flashcards' && generationState.data && (
                    <NotebookLMFlashcardDeck
                      cards={generationState.data as SourceGroundedCard[]}
                      deckTitle="From Source Documents"
                      onSaveCards={handleSaveCards}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SourceGroundedChat: React.FC = () => {
  return (
    <SourceDocumentsProvider>
      <ChatWithSources />
    </SourceDocumentsProvider>
  );
};

export default SourceGroundedChat;



