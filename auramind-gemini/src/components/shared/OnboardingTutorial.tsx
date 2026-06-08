import React from 'react';
import TutorialSystem, { TutorialStep } from './TutorialSystem';
import { useTutorial } from './TutorialSystem';
import {
  SparklesIcon as Sparkles,
  HomeIcon as Home,
  LayersIcon as Layers,
  BotIcon as Bot,
  BookOpenIcon as BookOpen,
  PlayIcon as Play,
  AwardIcon as Award,
} from '../icons/CustomIcons';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { completeTutorial } = useTutorial();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AuraMind',
      content:
        "Your AI-powered study companion. Generate flashcards from any topic, import documents, and master material with spaced repetition — all in one place.",
      position: 'center',
      icon: Sparkles,
    },
    {
      id: 'overview',
      title: 'Your Dashboard',
      content:
        'This is your command center. See cards due today, your study streak, and quick stats. The "Getting started" checklist below guides your first three wins.',
      target: '[data-testid="nav-main"]',
      position: 'right',
      icon: Home,
      action: () => {
        const el = document.querySelector('[data-testid="nav-main"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'decks',
      title: 'Decks & Cards',
      content:
        'Create flashcard decks manually, generate them with AI from a topic, or import PDFs and PowerPoint files. Every deck uses the SM-2 spaced repetition algorithm.',
      target: '[data-testid="nav-cards"]',
      position: 'right',
      icon: Layers,
      action: () => {
        const el = document.querySelector('[data-testid="nav-cards"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'chat',
      title: 'AI Study Buddy',
      content:
        'Ask questions in natural language, get Socratic-method explanations, generate quizzes, or create new flashcards — all through conversation. Supports Groq and in-browser local AI.',
      target: '[data-testid="nav-chat"]',
      position: 'right',
      icon: Bot,
      action: () => {
        const el = document.querySelector('[data-testid="nav-chat"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'paths',
      title: 'Learning Paths',
      content:
        'Follow structured courses across 6 subjects and 86 lessons: JavaScript, React, SQL, Machine Learning, Data Structures, and TypeScript. Enroll and progress at your own pace.',
      target: '[data-testid="nav-paths"]',
      position: 'right',
      icon: BookOpen,
      action: () => {
        const el = document.querySelector('[data-testid="nav-paths"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'study',
      title: 'Study Modes & Spaced Repetition',
      content:
        'Flip through flashcards with 3D animations, rate your recall (Again / Hard / Good / Easy), and let the SM-2 algorithm schedule the perfect review time. Quiz mode and focus mode are also available.',
      position: 'center',
      icon: Play,
    },
    {
      id: 'get-started',
      title: 'Ready to Learn?',
      content:
        'Create your first deck, generate cards with AI, and complete one study session. That\'s all it takes to build momentum. You can revisit this tutorial anytime from the sidebar.',
      position: 'center',
      icon: Award,
      completionAction: () => {
        completeTutorial('onboarding');
        onComplete?.();
      },
    },
  ];

  return (
    <TutorialSystem
      steps={tutorialSteps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={() => {
        completeTutorial('onboarding');
        onComplete?.();
      }}
      showProgress={true}
      allowSkip={true}
    />
  );
};

export default OnboardingTutorial;



