import React, { useState } from 'react';
import { Quiz } from '../../types';
import { CheckCircleIcon as CheckCircle, XCircleIcon as XCircle, RotateCcwIcon as RotateCcw } from '../icons/CustomIcons';
import MathRichText from '../shared/MathRichText';

interface ChatQuizProps {
  quiz: Quiz;
  onComplete?: (score: number, total: number) => void;
}

const ChatQuiz: React.FC<ChatQuizProps> = ({ quiz, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowFeedback(false);
    } else {
      setShowResults(true);
      const score = calculateScore();
      onComplete?.(score, quiz.questions.length);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowFeedback(false);
    }
  };

  const handleSubmit = () => {
    setShowFeedback(true);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === quiz.questions[index].correctAnswer ? score + 1 : score;
    }, 0);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setShowFeedback(false);
  };

  const currentQ = quiz.questions[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== undefined;

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <div className="bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-700">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Quiz Complete!</h3>
          <div className="text-3xl font-bold mb-2">
            <span className={`${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {percentage}%
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            You got {score} out of {quiz.questions.length} questions correct
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {quiz.questions.map((question, index) => {
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            return (
              <div key={question.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                {isCorrect ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  Question {index + 1}: {question.question.substring(0, 50)}...
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={resetQuiz}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {quiz.difficulty}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        {currentQ.header && (
          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
            {currentQ.header}
          </div>
        )}
        <div className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
          <MathRichText text={currentQ.question} />
        </div>

        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index;
            const isCorrect = index === currentQ.correctAnswer;
            const showCorrect = showFeedback && isCorrect;
            const showIncorrect = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showFeedback && handleAnswerSelect(index)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : showIncorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
: 'border-zinc-700 hover:border-zinc-600'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-800'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    showCorrect
                      ? 'border-green-500 bg-green-500'
                      : showIncorrect
                      ? 'border-red-500 bg-red-500'
                      : isSelected
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {(showCorrect || showIncorrect || isSelected) && (
                      <div className="w-2 h-2 bg-zinc-900 rounded-full" />
                    )}
                  </div>
                  <span className={`${
                    showCorrect ? 'text-green-700 dark:text-green-300' :
                    showIncorrect ? 'text-red-700 dark:text-red-300' :
                    'text-gray-900 dark:text-gray-100'
                  }`}>
                    <MathRichText text={option} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && currentQ.explanation && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Explanation:</h5>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <MathRichText text={currentQ.explanation} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <button
onClick={handlePrevious}
              className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Previous
            </button>
          )}
          
          <div className="flex-1" />
          
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswered}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isAnswered
                  ? 'bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatQuiz;



