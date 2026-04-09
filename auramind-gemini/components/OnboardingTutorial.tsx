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
        "AuraMind accelerates your learning. Skip the manual work and instantly convert any topic into study material.",
      position: 'center',
      icon: Sparkles,
      action: () => {
        console.log('Starting AuraMind tutorial');
      },
    },
    {
      id: 'core-action',
      title: '1-Tap Generation',
      content:
        'Just type what you want to learn here and tap Execute. Or tap "Load Sample Decks" below to start studying immediately.',
      target: '[data-testid="ai-generate-section"]',
      position: 'top',
      icon: BrainCircuit,
      action: () => {
        const generateSection = document.querySelector('[data-testid="ai-generate-section"]');
        generateSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      completionAction: () => {
        completeTutorial('onboarding');
        onComplete?.();
      },
    }
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
