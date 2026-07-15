import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon as X, ChevronRightIcon as ChevronRight } from '../icons/CustomIcons';

interface Tab {
  id: string;
  label: string;
}

interface Option {
  id: string;
  label: string;
  value: any;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
  allowCustom?: boolean;
}

interface InteractiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tabs: Tab[];
  questions: Question[];
  onConfirm: (answers: Record<string, any>) => void;
}

const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  isOpen,
  onClose,
  title,
  tabs,
  questions,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showCustomInput, setShowCustomInput] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isLastTab = activeTab === tabs.length - 1;

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowCustomInput(false);
    setCustomAnswer('');
  };

  const handleCustomInput = () => {
    setShowCustomInput(true);
    setSelectedOption(null);
  };

  const handleNext = useCallback(() => {
    const value = selectedOption !== null 
      ? currentQuestion.options.find(o => o.id === selectedOption)?.value
      : customAnswer;

    if (value !== undefined && value !== '') {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));

      if (isLastQuestion) {
        if (isLastTab) {
          onConfirm(answers);
          onClose();
        } else {
          setActiveTab(prev => prev + 1);
          setCurrentQuestionIndex(0);
          setSelectedOption(null);
          setCustomAnswer('');
          setShowCustomInput(false);
        }
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setCustomAnswer('');
        setShowCustomInput(false);
      }
    }
  }, [selectedOption, customAnswer, currentQuestion, isLastQuestion, isLastTab, answers, onConfirm, onClose]);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestionId = questions[currentQuestionIndex - 1].id;
      const prevAnswer = answers[prevQuestionId];
      if (prevAnswer) {
        const matchingOption = questions[currentQuestionIndex - 1].options.find(o => o.value === prevAnswer);
        if (matchingOption) {
          setSelectedOption(matchingOption.id);
        } else {
          setSelectedOption(null);
          setCustomAnswer(prevAnswer);
          setShowCustomInput(true);
        }
      }
    } else if (activeTab > 0) {
      setActiveTab(prev => prev - 1);
      setCurrentQuestionIndex(questions.length - 1);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevious();
        } else {
          handleNext();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedOption !== null) {
          const currentIndex = currentQuestion.options.findIndex(o => o.id === selectedOption);
          if (currentIndex > 0) {
            setSelectedOption(currentQuestion.options[currentIndex - 1].id);
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (selectedOption !== null) {
          const currentIndex = currentQuestion.options.findIndex(o => o.id === selectedOption);
          if (currentIndex < currentQuestion.options.length - 1) {
            setSelectedOption(currentQuestion.options[currentIndex + 1].id);
          }
        } else if (currentQuestion.options.length > 0) {
          setSelectedOption(currentQuestion.options[0].id);
        }
        break;
      case 'Enter':
        e.preventDefault();
        handleNext();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, selectedOption, currentQuestion, handleNext, handlePrevious, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setCustomAnswer('');
      setShowCustomInput(false);
      setAnswers({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-zinc-700 flex gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(index);
                  setCurrentQuestionIndex(0);
                  setSelectedOption(null);
                  setCustomAnswer('');
                  setShowCustomInput(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === index
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Question */}
          <div className="p-6">
            <p className="text-white text-lg mb-6">{currentQuestion.question}</p>

            {/* Options */}
            <div className="space-y-2 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOption === option.id
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      selectedOption === option.id
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'border-zinc-600 text-zinc-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="flex-1">{option.label}</span>
                    {selectedOption === option.id && (
                      <ChevronRight size={16} className="text-violet-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            {currentQuestion.allowCustom && (
              <div className="mb-6">
                <button
                  onClick={handleCustomInput}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCustomInput
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      showCustomInput
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'border-zinc-600 text-zinc-400'
                    }`}>
                      Edit

                    </span>
                    <span className="flex-1">Type your own answer</span>
                  </div>
                </button>

                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <input
                      type="text"
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                      autoFocus
                    />
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-zinc-500">
                <span><kbd className="px-2 py-1 bg-zinc-700 rounded">tab</kbd> navigate</span>
                <span><kbd className="px-2 py-1 bg-zinc-700 rounded">↑↓</kbd> select</span>
                <span><kbd className="px-2 py-1 bg-zinc-700 rounded">enter</kbd> confirm</span>
                <span><kbd className="px-2 py-1 bg-zinc-700 rounded">esc</kbd> dismiss</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0 && activeTab === 0}
                  className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedOption && !customAnswer}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isLastQuestion && isLastTab ? 'Confirm' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InteractiveOverlay;



