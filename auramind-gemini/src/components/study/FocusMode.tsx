import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { FocusIcon as Focus, XIcon as X, ClockIcon as Clock, Volume2Icon as Volume2, VolumeXIcon as VolumeX } from '../icons/CustomIcons';
import { trackStudySession } from '../../services/gamification/gamificationService';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FocusModeProps {
  cards: Flashcard[];
  onComplete: () => void;
  onExit: () => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ cards, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleAnswer = (correct: boolean) => {
    if (correct) setCorrectCount(prev => prev + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setShowComplete(true);
      const accuracy = Math.round((correctCount + (correct ? 1 : 0)) / cards.length * 100);
      trackStudySession(elapsedTime, accuracy);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Focus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Focus Session Complete!</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-sm text-muted">Cards Reviewed</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-muted">Time Spent</p>
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-lg font-semibold text-primary">
              {Math.round((correctCount / cards.length) * 100)}% Accuracy
            </p>
          </div>
          <Button onClick={onComplete} className="w-full" size="lg">
            Continue
          </Button>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-muted rounded-full">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2">
        <Progress value={(currentIndex / cards.length) * 100} className="h-1" />
        <p className="text-sm text-muted mt-1 text-center">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card
          className="w-full max-w-md aspect-[3/4] cursor-pointer flex flex-col items-center justify-center p-8 text-center transition-all duration-300"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="space-y-4">
            <p className="text-lg">{isFlipped ? currentCard.answer : currentCard.question}</p>
            <p className="text-sm text-muted">
              {isFlipped ? 'Tap to see question' : 'Tap to reveal answer'}
            </p>
          </div>
        </Card>
      </div>

      {/* Answer Buttons */}
      {isFlipped && (
        <div className="p-4 grid grid-cols-2 gap-4">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => handleAnswer(false)}
          >
            Need Review
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => handleAnswer(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Got It!
          </Button>
        </div>
      )}
    </div>
  );
};

export default FocusMode;


