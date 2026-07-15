import React, { useState, useMemo, useCallback } from 'react';
import { SourceGroundedQuestion } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2Icon as CheckCircle, XCircleIcon as XCircle,
  RotateCcwIcon as RotateCcw, ShuffleIcon as Shuffle,
  BookOpenIcon as BookOpen, TargetIcon as Target,
  ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight,
  FileTextIcon as FileText, SparklesIcon as Sparkles
} from '../icons/CustomIcons';

interface NotebookLMQuizProps {
  title: string;
  questions: SourceGroundedQuestion[];
  onComplete?: (score: number, total: number) => void;
}

type MasteryLevel = 'unanswered' | 'correct' | 'incorrect';

const NotebookLMQuiz: React.FC<NotebookLMQuizProps> = ({ title, questions: initialQuestions, onComplete }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({});
  const [mastery, setMastery] = useState<Record<number, MasteryLevel>>({});
  const [showResults, setShowResults] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const shuffledQuestions = useMemo(() => {
    if (!isShuffled) return questions;
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions, isShuffled]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (submittedQuestions[questionIndex]) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmit = (questionIndex: number) => {
    if (selectedAnswers[questionIndex] === undefined) return;
    const q = shuffledQuestions[questionIndex];
    const isCorrect = selectedAnswers[questionIndex] === q.correctAnswer;
    setSubmittedQuestions(prev => ({ ...prev, [questionIndex]: true }));
    setMastery(prev => ({ ...prev, [questionIndex]: isCorrect ? 'correct' : 'incorrect' }));
  };

  const handleNextQuestion = (questionIndex: number) => {
    const next = questionIndex + 1;
    if (next < shuffledQuestions.length) {
      const el = document.getElementById(`question-${next}`);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const allAnswered = shuffledQuestions.every((_, i) => submittedQuestions[i]);
      if (allAnswered) {
        const score = Object.entries(mastery).filter(([, v]) => v === 'correct').length;
        onComplete?.(score, questions.length);
      }
    }
  };

  const handleFinish = () => {
    setShowResults(true);
    const score = Object.entries(mastery).filter(([, v]) => v === 'correct').length;
    onComplete?.(score, questions.length);
  };

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
    setSelectedAnswers({});
    setSubmittedQuestions({});
    setMastery({});
  }, []);

  const resetQuiz = () => {
    setSelectedAnswers({});
    setSubmittedQuestions({});
    setMastery({});
    setShowResults(false);
    setIsShuffled(false);
  };

  const score = Object.entries(mastery).filter(([, v]) => v === 'correct').length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const allSubmitted = shuffledQuestions.every((_, i) => submittedQuestions[i]);

  if (showResults) {
    return (
      <motion.div
        className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6 text-center border-b border-zinc-800/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
            <Target size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{title} — Complete</h3>
          <div className="text-4xl font-black text-zinc-900 dark:text-white mb-2">
            <span className={percentage >= 80 ? 'text-emerald-400' : percentage >= 60 ? 'text-amber-400' : 'text-red-400'}>
              {percentage}%
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            {score}/{questions.length} correct
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {questions.map((q, i) => {
            const isCorrect = mastery[i] === 'correct';
            const ans = selectedAnswers[i];
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border text-sm ${
                  isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect
                    ? <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">{q.question}</p>
                    {!isCorrect && ans !== undefined && (
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Your answer: {q.options[ans]}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-400 mt-1">
                      Correct: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <button
            onClick={resetQuiz}
            className="w-full p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            Retake Quiz
          </button>
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
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Target size={14} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
              <p className="text-[10px] text-zinc-500">
                {Object.keys(submittedQuestions).length}/{shuffledQuestions.length} answered
              </p>
            </div>
          </div>
          <button
            onClick={toggleShuffle}
              className={`p-2 rounded-lg border transition-all ${
                isShuffled
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'bg-zinc-800 border-zinc-700/50 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
            title="Shuffle questions"
          >
            <Shuffle size={14} />
          </button>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(Object.keys(submittedQuestions).length / shuffledQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
        {shuffledQuestions.map((q, i) => {
          const isSubmitted = submittedQuestions[i];
          const selected = selectedAnswers[i];
          const isCorrect = mastery[i] === 'correct';
          const isIncorrect = mastery[i] === 'incorrect';

          return (
            <div key={q.id} id={`question-${i}`} className="scroll-mt-4">
              <div className={`p-4 rounded-xl border transition-all ${
                isCorrect
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : isIncorrect
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-zinc-800/30 border-zinc-800/50'
              }`}>
                {/* Question Header */}
                {q.header && (
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[10px] font-black text-violet-400 uppercase shrink-0 mt-1">
                      {q.header}
                    </span>
                  </div>
                )}
                {/* Question */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase shrink-0 mt-1">
                    Q{i + 1}
                  </span>
                  <p className="text-sm text-zinc-900 dark:text-white font-medium leading-relaxed">{q.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const isCorrectAnswer = oi === q.correctAnswer;
                    let optionStyle = 'border-zinc-800/60 bg-zinc-900/40 hover border-zinc-700/60';

                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optionStyle = 'border-emerald-500/40 bg-emerald-500/10';
                      } else if (isSelected && !isCorrectAnswer) {
                        optionStyle = 'border-red-500/40 bg-red-500/10';
                      } else {
                        optionStyle = 'border-zinc-800/60 bg-zinc-900/40 opacity-50';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-violet-500/40 bg-violet-500/10';
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswerSelect(i, oi)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${optionStyle} ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSubmitted && isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-500'
                              : isSubmitted && isSelected && !isCorrectAnswer
                                ? 'border-red-500 bg-red-500'
                                : isSelected
                                  ? 'border-violet-500 bg-violet-500'
                                  : 'border-zinc-600'
                          }`}>
                            {(isSubmitted && (isCorrectAnswer || (isSelected && !isCorrectAnswer))) || isSelected
                              ? <CheckCircle size={10} className="text-white" />
                              : null
                            }
                          </span>
                           <span className={`${
                             isSubmitted && isCorrectAnswer
                               ? 'text-emerald-300'
                               : isSubmitted && isSelected && !isCorrectAnswer
                                 ? 'text-red-300'
                                 : 'text-zinc-300'
                           }`}>
                            {opt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Source Citation */}
                {q.sourceExcerpt && (
                  <div className="mt-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText size={10} className="text-zinc-500" />
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">
                        Source  {q.sourceDocumentName || 'Document'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                      "{q.sourceExcerpt}"
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {isSubmitted && q.explanation && (
                    <motion.div
                      className="mt-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                    >
                    <p className="text-[10px] uppercase tracking-widest text-violet-400 font-black mb-1">Explanation</p>
                     <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{q.explanation}</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {!isSubmitted ? (
                    <button
                      onClick={() => handleSubmit(i)}
                      disabled={selected === undefined}
                       className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                         selected !== undefined
                           ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                           : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                       }`}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                         onClick={() => handleNextQuestion(i)}
                         className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                       >
                         {i < shuffledQuestions.length - 1 ? (
                           <>Next <ChevronRight size={12} /></>
                         ) : (
                           'Finish'
                         )}
                       </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {allSubmitted && !showResults && (
        <div className="p-4 border-t border-zinc-800/50">
           <button
             onClick={handleFinish}
             className="w-full p-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:from-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
           >
            <Sparkles size={14} />
            View Results
          </button>
        </div>
      )}

      {/* Mastery Summary Bar */}
      {Object.keys(mastery).length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-800/30 bg-zinc-900/40">
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-emerald-400" />
              <span className="text-zinc-400">
                Mastered  <span className="text-emerald-400 font-bold">{Object.values(mastery).filter(v => v === 'correct').length}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={10} className="text-red-400" />
              <span className="text-zinc-400">
                Needs Review  <span className="text-red-400 font-bold">{Object.values(mastery).filter(v => v === 'incorrect').length}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={10} className="text-zinc-500" />
              <span className="text-zinc-500">
                Remaining  {shuffledQuestions.length - Object.keys(mastery).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotebookLMQuiz;



