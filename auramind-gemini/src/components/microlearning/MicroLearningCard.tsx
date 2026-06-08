import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ChevronRightIcon as ChevronRight, ClockIcon as Clock, ZapIcon as Zap, CheckCircleIcon as CheckCircle, XIcon as X, LightbulbIcon as Lightbulb, BookOpenIcon as BookOpen, ArrowRightIcon as ArrowRight, RotateCcwIcon as RotateCcw } from '../icons/CustomIcons';

export interface MicroLesson {
  id: string;
  title: string;
  description: string;
  category: 'quick-tip' | 'fact' | 'concept' | 'challenge';
  content: string;
  duration: number; // seconds
  xpReward: number;
}

interface MicroLearningProps {
  lessons: MicroLesson[];
  onComplete: (lessonId: string, xpEarned: number) => void;
  category?: string;
}

const MicroLearningCard: React.FC<MicroLearningProps> = ({ lessons, onComplete, category }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const currentLesson = lessons[currentIndex];
  const progress = ((currentIndex + 1) / lessons.length) * 100;

  const handleComplete = () => {
    if (!completed.includes(currentLesson.id)) {
      setCompleted(prev => [...prev, currentLesson.id]);
      setTotalXP(prev => prev + currentLesson.xpReward);
      onComplete(currentLesson.id, currentLesson.xpReward);
    }

    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
    }
  };

  const getCategoryIcon = (cat: MicroLesson['category']) => {
    switch (cat) {
      case 'quick-tip':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'fact':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'concept':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'challenge':
        return <Zap className="w-5 h-5 text-orange-500" />;
    }
  };

  const getCategoryColor = (cat: MicroLesson['category']) => {
    switch (cat) {
      case 'quick-tip': return 'bg-yellow-500/20 text-yellow-500';
      case 'fact': return 'bg-blue-500/20 text-blue-500';
      case 'concept': return 'bg-purple-500/20 text-purple-500';
      case 'challenge': return 'bg-orange-500/20 text-orange-500';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  if (sessionComplete) {
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Session Complete!</h3>
        <p className="text-muted mb-4">
          You completed {lessons.length} micro-lessons
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">+{totalXP} XP</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Review Again
          </Button>
          <Button onClick={() => {}}>
            Continue Learning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentLesson) return null;

  return (
    <Card className="p-4">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted">Lesson {currentIndex + 1} of {lessons.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Lesson Card */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentLesson.category)}`}>
              {currentLesson.category.replace('-', ' ')}
            </span>
            {getCategoryIcon(currentLesson.category)}
          </div>
          <div className="flex items-center gap-1 text-muted text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(currentLesson.duration)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold">{currentLesson.title}</h3>

        {/* Content */}
        <div className="p-4 bg-muted/50 rounded-lg min-h-[120px] flex items-center justify-center">
          <p className="text-center">{currentLesson.content}</p>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Zap className="w-4 h-4 text-primary" />
            <span>+{currentLesson.xpReward} XP</span>
          </div>

          {!showAnswer ? (
            <Button onClick={() => setShowAnswer(true)}>
              Show Answer
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Got It!
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Skip option */}
      {showAnswer && currentIndex < lessons.length - 1 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={handleComplete}>
            Skip to next
          </Button>
        </div>
      )}
    </Card>
  );
};

// Sample micro-lessons for a topic
export const getSampleLessons = (): MicroLesson[] => [
  {
    id: '1',
    title: 'Quick Tip: Active Recall',
    description: 'Learn the most effective study technique',
    category: 'quick-tip',
    content: 'Active recall is studying that makes you think about the answer without looking at it. It\'s more effective than passive reading!',
    duration: 30,
    xpReward: 10
  },
  {
    id: '2',
    title: 'Did You Know?',
    description: 'An interesting fact',
    category: 'fact',
    content: 'The brain can hold approximately 2.5 petabytes of information - equivalent to roughly 3 million hours of YouTube videos!',
    duration: 20,
    xpReward: 5
  },
  {
    id: '3',
    title: 'Spaced Repetition',
    description: 'Learn about the spacing effect',
    category: 'concept',
    content: 'Studying a topic multiple times over spaced intervals is 150% more effective than cramming everything at once.',
    duration: 45,
    xpReward: 15
  },
  {
    id: '4',
    title: 'Today\'s Challenge',
    description: 'Apply what you learned',
    category: 'challenge',
    content: 'Try teaching a concept to someone else today. Teaching forces you to understand the material at a deeper level!',
    duration: 60,
    xpReward: 20
  }
];

export default MicroLearningCard;


