import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon as X,
  ArrowRightIcon as ArrowRight,
  ArrowLeftIcon as ArrowLeft,
  CheckIcon as Check,
} from '../icons/CustomIcons';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting element
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
  completionAction?: () => void; // Action when step is completed
  canSkip?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface TutorialSystemProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onStepChange?: (stepIndex: number, step: TutorialStep) => void;
  showProgress?: boolean;
  allowSkip?: boolean;
  className?: string;
}

const TutorialSystem: React.FC<TutorialSystemProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  onStepChange,
  showProgress = true,
  allowSkip = true,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && steps[currentStep]?.target) {
      const element = document.querySelector(steps[currentStep].target!);
      setHighlightedElement(element || null);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        
        // Execute action if provided
        steps[currentStep].action?.();
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightedElement(null);
      setHighlightRect(null);
    }
  }, [currentStep, isOpen, steps]);

  // Auto-focus on tutorial panel when it opens
  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      // Small delay to ensure the element is rendered and positioned
      const focusTimer = setTimeout(() => {
        if (tooltipRef.current) {
          // Focus the tutorial panel for better accessibility and visibility
          tooltipRef.current.focus();
          
          // Ensure the tutorial panel is visible in viewport
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const margin = 20; // Add margin for better visibility
          const isInViewport = 
            tooltipRect.top >= margin &&
            tooltipRect.left >= margin &&
            tooltipRect.bottom <= (window.innerHeight - margin) &&
            tooltipRect.right <= (window.innerWidth - margin);

          if (!isInViewport) {
            // Scroll the tutorial panel into view if it's outside viewport
            tooltipRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            });
          }
        }
      }, 150); // Slightly longer delay to ensure animation is in progress

      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen && onStepChange) {
      onStepChange(currentStep, steps[currentStep]);
    }
  }, [currentStep, isOpen, onStepChange, steps]);

  const handleNext = () => {
    const step = steps[currentStep];
    step.completionAction?.();
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!highlightRect || !tooltipRef.current) return { top: '50%', left: '50%' };
    
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const position = steps[currentStep].position || 'bottom';
    const margin = 20;

    switch (position) {
      case 'top':
        return {
          top: highlightRect.top - tooltipRect.height - margin,
          left: highlightRect.left + highlightRect.width / 2 - tooltipRect.width / 2,
        };
      case 'bottom':
        return {
          top: highlightRect.bottom + margin,
          left: highlightRect.left + highlightRect.width / 2 - tooltipRect.width / 2,
        };
      case 'left':
        return {
          top: highlightRect.top + highlightRect.height / 2 - tooltipRect.height / 2,
          left: highlightRect.left - tooltipRect.width - margin,
        };
      case 'right':
        return {
          top: highlightRect.top + highlightRect.height / 2 - tooltipRect.height / 2,
          left: highlightRect.right + margin,
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
        };
    }
  };

  const currentTutorialStep = steps[currentStep];
  const Icon = currentTutorialStep.icon;

  if (!isOpen || !currentTutorialStep) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-40 bg-arch-bg/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Highlight overlay */}
      {highlightedElement && highlightRect && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <svg className="absolute inset-0 w-full h-full">
            <rect
              x={highlightRect.left - 6}
              y={highlightRect.top - 6}
              width={highlightRect.width + 12}
              height={highlightRect.height + 12}
              fill="transparent"
              stroke="white"
              strokeWidth="1"
              className="arch-scan-line"
            />
            <rect
              x={highlightRect.left - 2}
              y={highlightRect.top - 2}
              width={highlightRect.width + 4}
              height={highlightRect.height + 4}
              fill="transparent"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              className="opacity-40"
            />
          </svg>
        </motion.div>
      )}

      {/* Tutorial Tooltip */}
      <AnimatePresence>
        <motion.div
          ref={tooltipRef}
          className={`fixed z-50 w-[480px] max-w-[calc(100vw-2rem)] border border-arch-border-bold bg-arch-bg p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${className}`}
          style={{
            ...getTooltipPosition(),
            transform: steps[currentStep].position === 'center' ? 'translate(-50%, -50%)' : undefined,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          tabIndex={-1}
        >
          <div className="absolute top-0 right-0 p-4">
             <div className="h-1.5 w-1.5 bg-arch-fg" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-arch-muted hover:text-arch-fg transition-colors"
          >
            <X size={16} />
          </button>

          {/* Content */}
          <div className="mb-8 space-y-5">
            {Icon && (
              <div className="h-12 w-12 flex items-center justify-center border border-arch-border bg-arch-fg/5 text-arch-fg">
                <Icon size={22} />
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="text-xl font-black uppercase tracking-tight text-arch-fg">
                {currentTutorialStep.title}
              </h3>
              
              <p className="text-sm font-medium leading-relaxed text-arch-muted">
                {currentTutorialStep.content}
              </p>
            </div>
          </div>

          {/* Progress */}
          {showProgress && (
            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-arch-muted">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="h-[2px] bg-arch-fg/10">
                <motion.div
                  className="h-full bg-arch-fg"
                  initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-arch-border">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="btn-arch-outline px-5 py-3 text-xs"
                >
                  <ArrowLeft size={14} />
                  Prev
                </button>
              )}
              
              {allowSkip && currentTutorialStep.canSkip !== false && (
                <button
                  onClick={handleSkip}
                  className="text-xs font-bold uppercase tracking-wider text-arch-muted hover:text-arch-fg transition-colors"
                >
                  Skip
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              className="btn-arch px-6 py-3 text-xs"
            >
              {currentStep === steps.length - 1 ? (
                <div className="flex items-center gap-2">
                  <span>Get Started</span>
                  <Check size={14} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Next</span>
                  <ArrowRight size={14} />
                </div>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Hook for managing tutorial state with localStorage persistence
export const useTutorial = () => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('auramind:completedTutorials');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set<string>(parsed);
      }
    } catch { /* intentionally ignored */ }
    return new Set<string>();
  });

  const persistTutorials = (updated: Set<string>) => {
    try {
      localStorage.setItem('auramind:completedTutorials', JSON.stringify([...updated]));
    } catch { /* intentionally ignored */ }
  };

  const startTutorial = (_tutorialId: string) => {
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const completeTutorial = (tutorialId: string) => {
    setCompletedTutorials(prev => {
      const updated = new Set([...prev, tutorialId]);
      persistTutorials(updated);
      return updated;
    });
    setIsTutorialOpen(false);
  };

  const isTutorialCompleted = (tutorialId: string) => {
    return completedTutorials.has(tutorialId);
  };

  return {
    isTutorialOpen,
    startTutorial,
    closeTutorial,
    completeTutorial,
    isTutorialCompleted,
    completedTutorials,
  };
};

export default TutorialSystem;



