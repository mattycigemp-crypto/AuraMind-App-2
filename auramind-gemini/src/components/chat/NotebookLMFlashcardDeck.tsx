import React, { useState, useMemo, useCallback } from 'react';
import { SourceGroundedCard } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon as Eye, EyeOffIcon as EyeOff, FolderOpenIcon as FolderOpen,
  ShuffleIcon as Shuffle, Trash2Icon as Trash2,
  CheckCircle2Icon as CheckCircle, XCircleIcon as XCircle,
  ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight,
  RotateCcwIcon as RotateCcw,
  BookOpenIcon as BookOpen, FileTextIcon as FileText
} from '../icons/CustomIcons';

interface NotebookLMFlashcardDeckProps {
  cards: SourceGroundedCard[];
  deckTitle?: string;
  onSaveCards?: (cards: SourceGroundedCard[], deckTitle: string) => void;
}

type MasteryStatus = 'unseen' | 'mastered' | 'needs_review';

const NotebookLMFlashcardDeck: React.FC<NotebookLMFlashcardDeckProps> = ({
  cards: initialCards,
  deckTitle: initialDeckTitle,
  onSaveCards,
}) => {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mastery, setMastery] = useState<Record<number, MasteryStatus>>({});
  const [isShuffled, setIsShuffled] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deckTitle, setDeckTitle] = useState(initialDeckTitle || '');
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');

  const displayCards = useMemo(() => {
    if (!isShuffled) return cards;
    return [...cards].sort(() => Math.random() - 0.5);
  }, [cards, isShuffled]);

  const currentCard = displayCards[currentIndex];
  const totalCards = displayCards.length;
  const masteredCount = Object.values(mastery).filter(v => v === 'mastered').length;
  const needsReviewCount = Object.values(mastery).filter(v => v === 'needs_review').length;
  const unseenCount = totalCards - Object.keys(mastery).length;

  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  }, [currentIndex, totalCards]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  }, [currentIndex]);

  const markMastered = useCallback(() => {
    setMastery(prev => ({ ...prev, [currentIndex]: 'mastered' }));
    setTimeout(handleNext, 400);
  }, [currentIndex, handleNext]);

  const markNeedsReview = useCallback(() => {
    setMastery(prev => ({ ...prev, [currentIndex]: 'needs_review' }));
    setTimeout(handleNext, 400);
  }, [currentIndex, handleNext]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, []);

  const deleteCard = useCallback((index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
    if (currentIndex >= totalCards - 1 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, totalCards]);

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setMastery({});
  }, []);

  const getMasteryColor = (status?: MasteryStatus) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'needs_review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-800/50 text-zinc-500 border-zinc-800/60';
    }
  };

  const getMasteryLabel = (status?: MasteryStatus) => {
    switch (status) {
      case 'mastered': return 'Mastered';
      case 'needs_review': return 'Needs Review';
      default: return 'Unseen';
    }
  };

  const handleSave = () => {
    if (deckTitle.trim() && onSaveCards) {
      onSaveCards(cards, deckTitle.trim());
      setShowSaveDialog(false);
    }
  };

  if (totalCards === 0) return null;

  // Grid View
  if (viewMode === 'grid') {
    return (
      <motion.div
        className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-5 py-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <BookOpen size={14} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{deckTitle || 'Flashcard Deck'}</h3>
                <p className="text-[10px] text-zinc-500">{totalCards} cards</p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('study')}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Study Mode
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {displayCards.map((card, i) => {
            const status = mastery[i];
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs transition-all ${getMasteryColor(status)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500">
                    Card {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${getMasteryColor(status)}`}>
                      {getMasteryLabel(status)}
                    </span>
                    <button
                      onClick={() => deleteCard(i)}
                      className="p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 font-medium mb-1">{card.question}</p>
                <p className="text-zinc-500 text-[11px]">{card.answer}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex gap-2">
            <button
              onClick={resetSession}
              className="flex-1 p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <RotateCcw size={12} className="inline mr-1" />
              Reset
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex-1 p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <FolderOpen size={12} className="inline mr-1" />
              Save to Deck
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <BookOpen size={14} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{deckTitle || 'Flashcard Deck'}</h3>
              <p className="text-[10px] text-zinc-500">
                Card {currentIndex + 1} of {totalCards}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg border transition-all ${
                isShuffled
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'bg-zinc-800 border-zinc-700/50 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
              title="Shuffle cards"
            >
              <Shuffle size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
              title="Grid view"
            >
              <BookOpen size={14} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(masteredCount / totalCards) * 100}%` }}
            />
          </div>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${(needsReviewCount / totalCards) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Question Side */}
            <div className="p-5 rounded-xl bg-zinc-800/30 border border-zinc-800/50 min-h-[100px]">
              {currentCard.header && (
                <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2">{currentCard.header}</p>
              )}
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Question</p>
              <p className="text-sm text-zinc-900 dark:text-white font-medium leading-relaxed">{currentCard.question}</p>
            </div>

            {/* Answer Side */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Answer</p>
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-all font-black uppercase tracking-widest"
                >
                  {showAnswer ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showAnswer ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <div className={`p-5 rounded-xl border transition-all min-h-[80px] ${
                showAnswer
                  ? 'bg-violet-500/5 border-violet-500/20'
                  : 'bg-zinc-800/30 border-zinc-800/50'
              }`}>
                <p className={`text-sm leading-relaxed transition-colors ${
                  showAnswer ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 select-none'
                }`}>
                  {showAnswer ? currentCard.answer : 'Click "Reveal" to see the answer'}
                </p>
              </div>
            </div>

            {/* Source Citation */}
            {showAnswer && currentCard.sourceExcerpt && (
              <motion.div
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={10} className="text-zinc-500" />
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">
                    Source: {currentCard.sourceDocumentName || 'Document'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                  "{currentCard.sourceExcerpt}"
                </p>
              </motion.div>
            )}

            {/* Difficulty Badge */}
            {currentCard.difficulty && (
              <div className="flex items-center gap-2">
                <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                  currentCard.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  currentCard.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {currentCard.difficulty}
                </span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getMasteryColor(mastery[currentIndex])}`}>
                  {getMasteryLabel(mastery[currentIndex])}
                </span>
              </div>
            )}

            {/* Mastery Actions */}
            {showAnswer && (
              <motion.div
                className="flex gap-2 pt-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={markNeedsReview}
                  className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  Needs Review
                </button>
                <button
                  onClick={markMastered}
                  className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  Mastered
                </button>
              </motion.div>
            )}

            {/* Delete + Navigation */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => deleteCard(currentIndex)}
                className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete card"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex-1" />

              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] text-zinc-500 font-medium tabular-nums">
                {currentIndex + 1}/{totalCards}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= totalCards - 1}
                className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mastery Summary Footer */}
      <div className="px-5 py-3 border-t border-zinc-800/30 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-emerald-400" />
              <span className="text-zinc-400"><span className="text-emerald-400 font-bold">{masteredCount}</span> Mastered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={10} className="text-amber-400" />
              <span className="text-zinc-400"><span className="text-amber-400 font-bold">{needsReviewCount}</span> Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={10} className="text-zinc-500" />
              <span className="text-zinc-500">{unseenCount} Left</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetSession}
              className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
              title="Reset session"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
            >
              <FolderOpen size={12} />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <FolderOpen size={18} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Save to Deck</h3>
                  <p className="text-[10px] text-zinc-500">{cards.length} cards</p>
                </div>
              </div>

              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                placeholder="Enter deck title..."
                className="w-full p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!deckTitle.trim()}
                  className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    deckTitle.trim()
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Save {cards.length} Cards
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotebookLMFlashcardDeck;



