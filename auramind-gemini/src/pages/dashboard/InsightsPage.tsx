import React, { useMemo } from 'react';
import { Activity, ArrowRight, ChevronLeft, Clock, TrendingUp, WandSparkles, Zap } from 'lucide-react';
import { Deck, Card } from '../../types';
import { MetricTile, BarSeries, getDeckAnalytics } from '../../components/shared/PageComponents';

const DashboardInsightsPage = ({ decks, cards }: { decks: Deck[], cards: Card[] }) => {
  const dueCards = cards.filter((c) => c.nextReview <= Date.now()).length;
  const masteredCards = cards.filter((c) => (c.interval || 0) >= 14 && (c.repetition || 0) >= 3).length;
  const retention = cards.length === 0 ? 0 : Math.round((masteredCards / cards.length) * 100);
  const topDecks = useMemo(
    () => [...getDeckAnalytics(decks, cards)].sort((a, b) => (b.cardCount || 0) - (a.cardCount || 0)).slice(0, 5),
    [cards, decks]
  );

  const weekly = [82, 94, 76, 88, 91, 74, 96];

  return (
    <div className="space-y-12 py-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-arch-border">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-arch-fg text-arch-bg text-[8px] font-black uppercase tracking-[0.4em]">
             <Activity size={10} />
             System Status: Optimized
          </div>
          <h1 className="text-arch-impact text-arch-fg leading-none">RETENTION<br /><span className="text-arch-muted">PROTOCOL.</span></h1>
        </div>
        <div className="text-right">
          <p className="text-arch-eyebrow mb-2">Total Cards Analyzed</p>
          <p className="text-6xl font-black italic text-arch-fg tracking-tighter">{cards.length.toString().padStart(3, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile label="Retention Quotient" value={`${retention}%`} detail="Mastery probability across entire library." />
        <MetricTile label="Mission Critical" value={dueCards} detail="Immediate reviews required for momentum." accent="text-amber-400" />
        <MetricTile label="Deep Memory" value={masteredCards} detail="Cards successfully encoded in long-term storage." accent="text-emerald-400" />
        <MetricTile label="Study Streak" value={12} detail="Consecutive days of architectural learning." accent="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 architectural-panel p-10 space-y-12">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
               <p className="text-arch-eyebrow">Cognitive Velocity</p>
               <h2 className="text-2xl font-black italic text-arch-fg uppercase">Weekly Performance.</h2>
            </div>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-arch-fg animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-arch-fg animate-pulse delay-75" />
              <div className="w-1 h-1 rounded-full bg-arch-fg animate-pulse delay-150" />
            </div>
          </div>
          <BarSeries values={weekly} labels={['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']} />
          <div className="pt-8 border-t border-arch-border flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted">
            <span>Historical baseline: 74%</span>
            <span>Projected Growth: +12.4%</span>
          </div>
        </div>

        <div className="architectural-panel p-0 flex flex-col">
          <div className="p-8 border-b border-arch-border bg-arch-muted/5">
             <p className="text-arch-eyebrow">Active Protocols</p>
             <h3 className="text-lg font-black italic text-arch-fg uppercase mt-2">Deck Breakdown.</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
             {topDecks.map((deck, idx) => (
               <div key={deck.id} className={`p-8 border-b border-arch-border hover:bg-arch-fg/5 transition-all group ${idx === topDecks.length - 1 ? 'border-b-0' : ''}`}>
                 <div className="flex items-start justify-between gap-4">
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-arch-fg uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">{deck.title}</p>
                     <div className="flex items-center gap-3">
                        <div className="w-24 h-[2px] bg-arch-border relative overflow-hidden">
                          <div className="absolute inset-0 bg-arch-fg transition-all duration-1000" style={{ width: `${deck.mastery}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-arch-muted italic">{deck.mastery}% Mastered</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-black text-arch-fg leading-none">{deck.due}</p>
                     <p className="text-[8px] font-black text-arch-muted uppercase tracking-widest mt-1">Due</p>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="architectural-panel p-10 bg-arch-muted/5 arch-scan-line">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-4 max-w-xl">
             <p className="text-arch-eyebrow">Aura Intelligence Report</p>
             <h3 className="text-3xl font-black italic text-arch-fg uppercase leading-tight">Your cognitive system is operating at peak capacity.</h3>
             <p className="text-arch-muted text-xs font-medium leading-relaxed italic">Focus on clearing your mission-critical backlog to maximize retention. The spacing algorithm optimizes review timing for long-term memory.</p>
           </div>
           <div className="flex gap-4">
             <button className="btn-arch px-10">Generate Strategy</button>
           </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardInsightsPage;
