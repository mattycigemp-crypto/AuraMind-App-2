import React from 'react';
import TutorialSystem, { TutorialStep } from './TutorialSystem';
import { useTutorial } from './TutorialSystem';
import {
  BrainCircuit,
  BookOpen,
  Plus,
  Target,
  Sparkles,
  Play,
  Lightbulb,
  Award,
} from 'lucide-react';

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
        "AuraMind helps you study with flashcards, smart review timing, and AI study tools. Let's take a quick tour so you can get started fast.",
      position: 'center',
      icon: Sparkles,
      action: () => {
        console.log('Starting AuraMind tutorial');
      },
    },
    {
      id: 'dashboard-overview',
      title: 'Your Study Dashboard',
      content:
        "This is your main study page. It now combines your AI operator, deck performance, leaderboard, and control surfaces so you can move fast without losing context.",
      target: '[data-testid="dashboard-header"]',
      position: 'bottom',
      icon: BrainCircuit,
      action: () => {
        const statsElement = document.querySelector('[data-testid="progress-snapshot"]');
        statsElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'create-deck',
      title: 'Create Your First Deck',
      content:
        'Create a deck from scratch or let Aura Operator generate one for you. This is the quickest path into the app.',
      target: '[data-testid="create-deck-button"]',
      position: 'bottom',
      icon: Plus,
      completionAction: () => {
        console.log('Ready to create first deck');
      },
    },
    {
      id: 'deck-cards',
      title: 'Your Flashcard Decks',
      content:
        'Each deck now carries real performance metadata like mastery, due count, and study volume so the ranking and insights pages stay grounded in actual activity.',
      target: '[data-testid="decks-list"]',
      position: 'top',
      icon: BookOpen,
      action: () => {
        const firstDeck = document.querySelector('[data-testid="deck-card"]');
        if (firstDeck) {
          firstDeck.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            firstDeck.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
      },
    },
    {
      id: 'ai-generation',
      title: 'AI-Powered Generation',
      content:
        'Aura Operator is the flagship AI surface. Use it to research, coach, and create decks that actually save into your library.',
      target: '[data-testid="ai-generate-section"]',
      position: 'top',
      icon: Sparkles,
      action: () => {
        const generateSection = document.querySelector('[data-testid="ai-generate-section"]');
        generateSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      id: 'progress-tracking',
      title: 'Track Your Progress',
      content:
        'Your dashboard now exposes focus score, retention lift, and study pulse. These signals help you decide what to attack next.',
      target: '[data-testid="progress-snapshot"]',
      position: 'left',
      icon: Target,
      action: () => {
        const progressBars = document.querySelectorAll('[data-testid="progress-bar"]');
        progressBars.forEach(bar => {
          bar.classList.add('animate-pulse');
          setTimeout(() => {
            bar.classList.remove('animate-pulse');
          }, 2000);
        });
      },
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard and Ranking',
      content:
        'The leaderboard now uses real deck scores from this account instead of fabricated names or points. Ranking updates as your decks improve.',
      target: '[data-testid="leaderboard-section"]',
      position: 'left',
      icon: Award,
      action: () => {
        console.log('Showing leaderboard details');
      },
    },
    {
      id: 'ready-to-start',
      title: "You're All Set",
      content:
        'You now know the basics of AuraMind. Start by creating your first deck or trying the AI tools. Regular review is what helps the most.',
      position: 'center',
      icon: Award,
      completionAction: () => {
        completeTutorial('onboarding');
        onComplete?.();
        console.log('Onboarding completed!');
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
