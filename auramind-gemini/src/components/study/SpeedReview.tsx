import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ZapIcon as Zap, XIcon as X, TimerIcon as Timer, RotateCcwIcon as RotateCcw } from '../icons/CustomIcons';
import { trackStudySession } from '../../services/gamification/gamificationService';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface SpeedReviewProps {
  cards: Flashcard[];
  timePerCard: number;
  onComplete: () => void;
  onExit: () => void;
}

const SpeedReview: React.FC<SpeedReviewProps> = ({ cards, timePerCard = 5, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerCard);
  const [startTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCard = cards[currentIndex];

  const finishSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = Math.round((correctCount / cards.length) * 100);
    trackStudySession(elapsedTime, accuracy);
    setShowComplete(true);
  }, [startTime, correctCount, cards.length]);

  const handleSkip = useCallback(() => {
    setSkippedCount(prev => prev + 1);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setTimeLeft(timePerCard);
    } else {
      finishSession();
    }
  }, [currentIndex, cards.length, timePerCard, finishSession]);

  useEffect(() => {
    if (!isFlipped && !showComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSkip();
            return timePerCard;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFlipped, showComplete, currentIndex, timePerCard, handleSkip]);

  const handleAnswer = (correct: boolean) => {
    if (correct) setCorrectCount(prev => prev + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setTimeLeft(timePerCard);
    } else {
      finishSession();
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const progress = ((currentIndex + 1) / cards.length) * 100;
  const isUrgent = timeLeft <= 2;

  if (showComplete) {
    const totalAnswered = correctCount + skippedCount;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold">Speed Review Complete!</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xl font-bold text-green-500">{correctCount}</p>
              <p className="text-xs text-muted">Correct</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <p className="text-xl font-bold text-red-500">{skippedCount}</p>
              <p className="text-xs text-muted">Skipped</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-xl font-bold text-primary">{cards.length}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-lg font-semibold text-yellow-600">
              {accuracy}% Accuracy
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={onComplete} className="flex-1">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onExit} className="p-2 hover:bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-muted'}`} />
          <span className={`font-mono font-bold ${isUrgent ? 'text-red-500' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2">
        <Progress value={progress} className={`h-1 ${isUrgent ? 'bg-red-500' : ''}`} />
        <p className="text-sm text-muted mt-1 text-center">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Timer Bar */}
      <div className="h-1 bg-muted/20">
        <div
          className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-yellow-500'}`}
          style={{ width: `${(timeLeft / timePerCard) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card
          className="w-full max-w-md aspect-[3/4] cursor-pointer flex flex-col items-center justify-center p-6 text-center"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <p className="text-xl">{isFlipped ? currentCard.answer : currentCard.question}</p>
          <p className="text-sm text-muted mt-4">
            {isFlipped ? 'Tap for question' : 'Tap for answer'}
          </p>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-2">
        {isFlipped ? (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              Skip
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAnswer(false)}
            >
              Missed
            </Button>
            <Button
              onClick={() => handleAnswer(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Got It!
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsFlipped(true)} className="w-full" size="lg">
            Show Answer
          </Button>
        )}
      </div>
    </div>
  );
};

export default SpeedReview;


