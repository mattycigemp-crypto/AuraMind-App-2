import React from 'react';
import { Activity } from 'lucide-react';
import { Deck, Card } from '../../types';
import HelpTooltip from './HelpTooltip';

const PageHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) => (
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-20">
    <div className="space-y-6">
      <p className="text-arch-eyebrow">{subtitle}</p>
      <h1 className="text-arch-impact text-arch-fg">{title}</h1>
    </div>
    {action}
  </div>
);

const MetricTile = ({
  label,
  value,
  detail,
  accent = 'text-arch-fg',
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: string;
}) => (
  <div className="architectural-panel arch-scan-line p-10 group hover:border-arch-border-bold transition-all flex flex-col justify-between min-h-[220px]">
    <p className="text-arch-eyebrow mb-6">{label}</p>
    <div>
      <p className={`text-arch-metric ${accent}`}>{value}</p>
      <div className="mt-6 pt-6 border-t border-arch-border">
         <p className="text-[10px] text-arch-muted uppercase tracking-[0.2em] italic font-medium">{detail}</p>
      </div>
    </div>
  </div>
);

const BarSeries = ({ values, labels }: { values: number[]; labels: string[] }) => (
  <div className="flex items-end gap-4 h-56 px-4">
    {values.map((value, index) => (
      <div key={`${labels[index]}-${value}`} className="flex-1 flex flex-col items-center gap-6">
        <div className="w-full bg-arch-fg relative overflow-hidden" style={{ height: `${Math.max(12, value)}%` }}>
           <div className="absolute inset-0 bg-arch-bg/10 animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted">{labels[index]}</span>
      </div>
    ))}
  </div>
);

const getDeckAnalytics = (decks: Deck[], cards: Card[]) =>
  decks.map((deck) => {
    const deckCards = cards.filter((card) => card.deckId === deck.id);
    const due = deckCards.filter((card) => card.nextReview <= Date.now()).length;
    const mastered = deckCards.filter((card) => card.interval >= 14 && card.repetition >= 3).length;
    const mastery = deckCards.length === 0 ? 0 : Math.round((mastered / deckCards.length) * 100);

    return {
      ...deck,
      due,
      mastery,
      reviews: deckCards.reduce((total, card) => total + (card.repetition || 0), 0),
    };
  });

const normalizeSeries = (values: number[], fallback = 12) =>
  (values.length ? values : [fallback, fallback, fallback, fallback, fallback, fallback, fallback]).slice(0, 7).concat(
    Array(Math.max(0, 7 - values.length)).fill(fallback)
  ).slice(0, 7);

const CitationStack = ({ card }: { card: Card }) => {
  if (!card.citations?.length) {
    return (
      <div className="mt-4 rounded-2xl border border-arch-border bg-arch-bg/60 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-arch-muted">Trust Layer</p>
        <p className="text-xs text-arch-fg mt-2 italic">Source verification not available for this card.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-arch-border bg-arch-bg/60 p-4">
      <p className="text-[9px] uppercase tracking-[0.3em] text-arch-muted">Trust Layer</p>
      <div className="space-y-2 mt-2">
        {card.citations.map((citation, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <div className="w-1 h-1 rounded-full bg-arch-fg mt-1.5 flex-shrink-0" />
            <span className="text-arch-fg">
              {citation.label}
              {citation.excerpt && `: ${citation.excerpt}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { PageHeader, MetricTile, BarSeries, getDeckAnalytics, normalizeSeries, CitationStack, HelpTooltip };