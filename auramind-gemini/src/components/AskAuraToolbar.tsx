import { useState } from 'react';
import {
  Lightbulb, HelpCircle, Wand2, MessageCircle, Sparkles, ChevronRight
} from '@/components/icons';
import { useAuraContext, StudyContext, AuraEntrypoint } from '../contexts/AuraContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface AskAuraToolbarProps {
  /** Where this toolbar is being shown */
  context: Omit<StudyContext, 'timestamp'>;
  /** Optional extra class */
  className?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

export default function AskAuraToolbar({ context, className, compact = false }: AskAuraToolbarProps) {
  const { setStudyContext } = useAuraContext();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const openAura = (entrypoint: AuraEntrypoint) => {
    setStudyContext({ ...context, entrypoint, timestamp: Date.now() });
    navigate('/tutor');
  };

  const actions = getActions(context);

  if (actions.length === 0) return null;

  if (compact) {
    return (
      <div className={clsx('flex gap-2 flex-wrap', className)}>
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => openAura(a.entrypoint)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              a.style === 'primary'
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                : a.style === 'accent'
                ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('flex gap-3 flex-wrap', className)}>
      {actions.map((a) => (
        <motion.button
          key={a.id}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openAura(a.entrypoint)}
          onMouseEnter={() => setHovered(a.id)}
          onMouseLeave={() => setHovered(null)}
          className={clsx(
            'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
            'transition-all duration-200 cursor-pointer',
            a.style === 'primary'
              ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-200 border border-amber-500/25 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10'
              : a.style === 'accent'
              ? 'bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-200 border border-violet-500/25 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10'
              : 'bg-white/[0.04] text-white/70 border border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
          )}
        >
          <span className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            a.style === 'primary' ? 'bg-amber-500/20' : a.style === 'accent' ? 'bg-violet-500/20' : 'bg-white/10'
          )}>
            {a.icon}
          </span>
          <span className="flex-1 text-left">
            <span className="block">{a.label}</span>
            {a.description && (
              <span className="block text-xs opacity-60 mt-0.5">{a.description}</span>
            )}
          </span>
          <ChevronRight size={14} className="opacity-40 group-hover:opacity-70 transition-opacity" />

          {/* Tooltip */}
          <AnimatePresence>
            {hovered === a.id && a.tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-xs text-white/80 whitespace-nowrap pointer-events-none z-50"
              >
                {a.tooltip}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  );
}

interface ToolbarAction {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  icon: React.ReactNode;
  entrypoint: AuraEntrypoint;
  style: 'primary' | 'accent' | 'default';
}

function getActions(context: Omit<StudyContext, 'timestamp'>): ToolbarAction[] {
  const actions: ToolbarAction[] = [];

  // Context-specific actions
  if (context.entrypoint === 'card-again' && context.card) {
    actions.push({
      id: 'explain',
      label: 'Explain this',
      description: 'Get a clear explanation of this card',
      tooltip: 'Ask Aura to explain this concept',
      icon: <Lightbulb size={16} />,
      entrypoint: 'card-again',
      style: 'primary',
    });
    actions.push({
      id: 'quiz-me',
      label: 'Quiz me',
      description: 'Test your understanding',
      tooltip: 'Aura will quiz you on this concept',
      icon: <HelpCircle size={16} />,
      entrypoint: 'card-again',
      style: 'accent',
    });
  }

  if (context.entrypoint === 'quiz-wrong' && context.quiz) {
    actions.push({
      id: 'why-wrong',
      label: 'Why was I wrong?',
      description: 'Understand the misconception',
      tooltip: 'Aura explains what went wrong',
      icon: <Lightbulb size={16} />,
      entrypoint: 'quiz-wrong',
      style: 'primary',
    });
    actions.push({
      id: 'try-again',
      label: 'Try another question',
      description: 'Practice with a new question',
      icon: <HelpCircle size={16} />,
      entrypoint: 'quiz-wrong',
      style: 'accent',
    });
  }

  if (context.entrypoint === 'deck-ask' && context.deck) {
    actions.push({
      id: 'ask-deck',
      label: `Ask about ${context.deck.name}`,
      description: `${context.deck.cardCount} cards · ${context.deck.subject || 'General'}`,
      icon: <MessageCircle size={16} />,
      entrypoint: 'deck-ask',
      style: 'primary',
    });
  }

  if (context.entrypoint === 'cards-improve' && context.cards) {
    actions.push({
      id: 'improve-cards',
      label: 'Improve these cards',
      description: `${context.cards.length} cards to review`,
      icon: <Wand2 size={16} />,
      entrypoint: 'cards-improve',
      style: 'primary',
    });
  }

  // Always offer standalone if no specific context
  if (context.entrypoint === 'standalone') {
    actions.push({
      id: 'ask-anything',
      label: 'Ask Aura anything',
      description: 'Your study assistant',
      icon: <Sparkles size={16} />,
      entrypoint: 'standalone',
      style: 'default',
    });
  }

  return actions;
}
