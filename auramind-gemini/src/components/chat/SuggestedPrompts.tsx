import type { ChatMode } from '../../hooks/useAIChat';

interface Props {
  mode: ChatMode;
  deckName: string;
  currentCardTerm?: string;
  onSelect: (prompt: string) => void;
}

function getPrompts(mode: ChatMode, deckName: string, currentCardTerm?: string): string[] {
  switch (mode) {
    case 'explain':
      return [
        'Why does this work?',
        `Explain ${currentCardTerm ?? 'this concept'} differently`,
        'Give me an analogy',
        'What are common mistakes?',
      ];
    case 'quiz':
      return [
        'Quiz me harder',
        'Easier question',
        `More on ${deckName}`,
        'What should I study next?',
      ];
    case 'generate':
      return [
        `5 more cards on ${deckName}`,
        'Generate exception cases',
        'Make cards about related concepts',
        'Simpler versions of these cards',
      ];
    case 'free':
      return [
        'What are my weakest areas?',
        'Study plan for today',
        `Summarize ${deckName}`,
        'What should I learn next?',
      ];
  }
}

export default function SuggestedPrompts({ mode, deckName, currentCardTerm, onSelect }: Props) {
  const prompts = getPrompts(mode, deckName, currentCardTerm);

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
      {prompts.map(prompt => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="flex-none text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 hover:border-purple-600 hover:text-zinc-200 cursor-pointer whitespace-nowrap transition-colors duration-150"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
