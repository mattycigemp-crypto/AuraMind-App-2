import React, { useState } from 'react';
import { FlashcardData } from '../../types';
import { EyeIcon as Eye, EyeOffIcon as EyeOff, PlusIcon as Plus, FolderOpenIcon as FolderOpen } from '../icons/CustomIcons';
import MathRichText from '../shared/MathRichText';

interface ChatFlashcardPreviewProps {
  cards: FlashcardData[];
  onSaveCards?: (cards: FlashcardData[], deckTitle: string) => void;
}

const ChatFlashcardPreview: React.FC<ChatFlashcardPreviewProps> = ({ cards, onSaveCards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleSave = () => {
    if (deckTitle.trim() && onSaveCards) {
      onSaveCards(cards, deckTitle.trim());
      setShowSaveDialog(false);
      setDeckTitle('');
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };

  return (
    <>
      <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Flashcard Preview</h3>
            <div className="flex items-center gap-2">
              {currentCard.difficulty && (
                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(currentCard.difficulty)}`}>
                  {currentCard.difficulty}
                </span>
              )}
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white text-sm rounded-lg transition-colors"
              >
                <Plus size={14} />
                Save to Deck
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Card {currentIndex + 1} of {cards.length}
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          {currentCard.header && (
            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
              {currentCard.header}
            </div>
          )}
          <div className="mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Question:</div>
            <div className="p-4 bg-zinc-800 rounded-lg min-h-[80px] flex items-center">
              <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                <MathRichText text={currentCard.question} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Answer:</div>
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAnswer ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className={`p-4 rounded-lg min-h-[80px] flex items-center transition-colors ${
              showAnswer 
                ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700' 
                : 'bg-zinc-800'
            }`}>
              <div className={`whitespace-pre-wrap ${
                showAnswer 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-400 dark:text-gray-500 select-none'
              }`}>
                {showAnswer ? <MathRichText text={currentCard.answer} /> : 'Click to reveal answer'}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
currentIndex === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Previous
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className={`px-4 py-2 rounded-lg transition-colors ${
currentIndex === cards.length - 1
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white'
              }`}
            >
              {currentIndex === cards.length - 1 ? 'Last Card' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen size={20} className="text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Save Flashcards to Deck
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a new deck with {cards.length} flashcard{cards.length !== 1 ? 's' : ''}
            </p>

            <input
              type="text"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="Enter deck title..."
              className="w-full p-3 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-zinc-800 text-white mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setDeckTitle('');
                }}
                className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!deckTitle.trim()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  deckTitle.trim()
                    ? 'bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Save {cards.length} Card{cards.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatFlashcardPreview;



