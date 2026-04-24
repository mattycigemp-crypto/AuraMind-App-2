import React from 'react';
import { Card } from '../../types';

interface CitationStackProps {
  card: Card;
}

const CitationStack: React.FC<CitationStackProps> = ({ card }) => {
  if (!card.citations?.length) {
    return (
      <div className="mt-4 rounded-2xl border border-arch-border bg-arch-bg/60 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-arch-muted">Trust Layer</p>
        <p className="mt-2 text-xs text-arch-muted italic">No attached citations yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-arch-border bg-arch-bg/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.3em] text-arch-muted">Trust Layer</p>
        <span className="text-[9px] uppercase tracking-[0.3em] text-arch-fg">{card.trustScore || 80}% confidence</span>
      </div>
      {card.citations[0]?.excerpt && (
        <div className="rounded-xl border border-arch-border bg-arch-fg/[0.04] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arch-fg">Source Highlight</p>
          <p className="mt-2 text-xs text-arch-muted leading-relaxed">"{card.citations[0].excerpt}"</p>
        </div>
      )}
      {card.citations.map((citation) => (
        <div key={citation.id} className="rounded-xl border border-arch-border bg-arch-fg/[0.03] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arch-fg">{citation.label}</p>
          {citation.locator && <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-arch-muted">{citation.locator}</p>}
          {citation.excerpt && <p className="mt-2 text-xs text-arch-muted leading-relaxed">{citation.excerpt}</p>}
        </div>
      ))}
    </div>
  );
};

export default CitationStack;
