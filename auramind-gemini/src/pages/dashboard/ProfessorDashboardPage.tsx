import React, { useMemo } from 'react';
import { GraduationCap, Quote } from 'lucide-react';
import { Deck, Card, UserProfile } from '../../types';
import { PageHeader, MetricTile, BarSeries, getDeckAnalytics, normalizeSeries } from '../../components/shared/PageComponents';

export const ProfessorDashboardPage = ({ decks, cards, user }: { decks: Deck[]; cards: Card[]; user: UserProfile }) => {
  const analytics = useMemo(() => getDeckAnalytics(decks, cards), [decks, cards]);
  const adoption = analytics.length === 0 ? 0 : Math.round((analytics.filter((deck) => deck.cardCount > 0).length / analytics.length) * 100);
  const atRiskDecks = analytics.filter((deck) => deck.due > Math.max(3, Math.ceil(deck.cardCount * 0.25)));
  const strongestDecks = [...analytics].sort((a, b) => b.mastery - a.mastery).slice(0, 4);
  const weeklySignals = normalizeSeries(analytics.slice(0, 7).map((deck) => Math.min(100, deck.mastery + deck.reviews)));
  const citationCoverage = cards.length === 0 ? 0 : Math.round((cards.filter((card) => card.citations?.length).length / cards.length) * 100);

  return (
    <div className="space-y-12 py-6">
      <PageHeader
        title="PROFESSOR DASHBOARD."
        subtitle="Pilot B2B analytics view for curriculum, cohort risk, and content quality."
        action={
          <div className="inline-flex items-center gap-3 px-4 py-3 border border-arch-border bg-arch-fg/5">
            <GraduationCap size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{user.name} faculty pilot</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricTile label="Deck Adoption" value={`${adoption}%`} detail="Decks with active content and measurable usage." />
        <MetricTile label="Citation Coverage" value={`${citationCoverage}%`} detail="Flashcards with visible source anchoring attached." accent="text-emerald-400" />
        <MetricTile label="At-Risk Modules" value={atRiskDecks.length} detail="Decks with unusually high due backlog." accent="text-amber-400" />
        <MetricTile label="Total Reviews" value={cards.reduce((sum, card) => sum + (card.repetition || 0), 0)} detail="Cohort review volume captured inside AuraMind." accent="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="architectural-panel p-10 space-y-10">
          <div>
            <p className="text-arch-eyebrow">Cohort Pulse</p>
            <h2 className="text-2xl font-black italic uppercase text-arch-fg mt-2">Mastery and workload by active module.</h2>
          </div>
          <BarSeries values={weeklySignals} labels={['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']} />
          <div className="grid gap-4">
            {analytics.slice(0, 6).map((deck) => (
              <div key={deck.id} className="border border-arch-border p-5 bg-arch-bg/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-arch-fg">{deck.title}</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-arch-muted mt-2">{deck.cardCount} cards • {deck.reviews} reviews • {deck.mastery}% mastery</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic text-arch-fg">{deck.due}</p>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-arch-muted">due now</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="architectural-panel p-8 space-y-6">
            <div>
              <p className="text-arch-eyebrow">Interventions</p>
              <h3 className="text-xl font-black italic uppercase text-arch-fg mt-2">High-risk modules</h3>
            </div>
            {atRiskDecks.length === 0 && (
              <p className="text-sm text-arch-muted italic">No modules are over the risk threshold right now.</p>
            )}
            {atRiskDecks.map((deck) => (
              <div key={deck.id} className="border border-arch-border p-5 bg-arch-fg/[0.03]">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">{deck.title}</p>
                <p className="mt-2 text-xs text-arch-muted">{deck.due} reviews are due. Recommend a guided review block and source refresh.</p>
              </div>
            ))}
          </div>

          <div className="architectural-panel p-8 space-y-6">
            <div>
              <p className="text-arch-eyebrow">Quality Signals</p>
              <h3 className="text-xl font-black italic uppercase text-arch-fg mt-2">Most stable decks</h3>
            </div>
            {strongestDecks.map((deck) => (
              <div key={deck.id} className="border border-arch-border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">{deck.title}</p>
                    <p className="mt-2 text-xs text-arch-muted">{deck.mastery}% mastery with {deck.reviews} total reviews recorded.</p>
                  </div>
                  <Quote size={16} className="text-arch-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
