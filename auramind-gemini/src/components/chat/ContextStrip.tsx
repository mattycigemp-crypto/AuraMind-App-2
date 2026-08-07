import { Layers, Clock, History } from '@/components/icons';

interface Props {
  deckName: string;
  cardsDueToday: number;
  lastReviewed?: string;
  className?: string;
}

export default function ContextStrip({ deckName, cardsDueToday, lastReviewed, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-zinc-900 border-b border-zinc-800 ${className}`}>
      <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
        <Layers size={12} className="text-purple-500" />
        {deckName}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
        <Clock size={12} className="text-zinc-500" />
        {cardsDueToday} cards due
      </span>
      {lastReviewed && (
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
          <History size={12} className="text-zinc-500" />
          {lastReviewed}
        </span>
      )}
    </div>
  );
}
