import React from 'react';

interface WeakCard {
  id: string;
  question: string;
  retrievability: number;
  stability: number;
  difficulty: number;
  deckName?: string;
}

interface WeakestCardsTableProps {
  data: WeakCard[];
  className?: string;
  onCardClick?: (id: string) => void;
}

const WeakestCardsTable: React.FC<WeakestCardsTableProps> = ({ data, className, onCardClick }) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-zinc-600 italic text-sm ${className}`}>
        No weak cards found — all pathways stable
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Card</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Retrievability</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Stability</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Difficulty</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3">Deck</th>
            </tr>
          </thead>
          <tbody>
            {data.map((card) => {
              const retrievabilityPct = Math.round(card.retrievability * 100);
              const stabilityDays = Math.round(card.stability);
              return (
                <tr
                  key={card.id}
                  onClick={() => onCardClick?.(card.id)}
                  className="border-b border-primary/5 hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-3 pr-4">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate max-w-[200px]">
                      {card.question}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${retrievabilityPct < 50 ? 'bg-red-500' : retrievabilityPct < 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${retrievabilityPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">{retrievabilityPct}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-bold text-zinc-400">{stabilityDays}d</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-bold text-zinc-400">{card.difficulty.toFixed(1)}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{card.deckName || '—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { WeakestCardsTable };
export type { WeakCard };



