import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, Command, TrendingUp, WandSparkles, Zap } from 'lucide-react';
import { Deck, Card } from '../../types';
import MathRichText from '../../components/shared/MathRichText';
import { getDeckAnalytics } from '../../components/shared/PageComponents';

export const DashboardPlannerPage = ({ decks, cards }: { decks: Deck[], cards: Card[] }) => {
  const navigate = useNavigate();
  const upcoming = [...cards]
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, 8);
  const dueDecks = getDeckAnalytics(decks, cards).filter((deck) => deck.due > 0).sort((a, b) => b.due - a.due);

  return (
    <div className="space-y-12 py-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-arch-border">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-blue-500 text-slate-900 dark:text-white text-[8px] font-black uppercase tracking-[0.4em]">
             <CalendarDays size={10} />
             Duty Roster Active
          </div>
          <h1 className="text-arch-impact text-arch-fg leading-none">STRATEGIC<br /><span className="text-arch-muted">PLANNER.</span></h1>
        </div>
        <div className="text-right">
          <p className="text-arch-eyebrow mb-2">Next Sync Window</p>
          <p className="text-4xl font-black italic text-arch-fg tracking-tighter uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-10">
        <div className="space-y-8">
           <div className="architectural-panel p-0 overflow-hidden">
              <div className="p-8 border-b border-arch-border bg-arch-muted/5 flex items-center justify-between">
                <div>
                   <p className="text-arch-eyebrow">Deployment Feed</p>
                   <h3 className="text-lg font-black italic text-arch-fg uppercase mt-2">Next 8 Mission Windows.</h3>
                </div>
                <TrendingUp size={16} className="text-arch-muted" />
              </div>
              <div className="divide-y divide-arch-border">
                {upcoming.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-arch-muted italic text-[10px] uppercase tracking-[0.5em]">No active missions scheduled.</p>
                  </div>
                )}
                {upcoming.map((card, idx) => (
                  <div key={card.id} className="p-8 hover:bg-arch-fg/[0.02] transition-all flex items-center gap-8 group">
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-[8px] font-black text-arch-muted uppercase tracking-widest italic mb-1">POS</p>
                      <p className="text-xl font-black italic text-arch-fg">{idx + 1}</p>
                    </div>
                    <div className="flex-grow space-y-3">
                       <div className="text-xs font-bold leading-relaxed text-arch-fg group-hover:translate-x-1 transition-transform">
                         <MathRichText text={card.question} />
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[8px] font-black text-arch-muted uppercase tracking-[0.3em] flex items-center gap-1">
                             <Clock size={10} />
                             DEBUT: {new Date(card.nextReview).toLocaleDateString()}
                          </span>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => navigate('/dashboard')} className="p-4 border border-arch-border text-arch-muted hover:text-arch-fg hover:border-arch-fg transition-all">
                          <ArrowRight size={14} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="space-y-10">
          <div className="architectural-panel p-0 bg-arch-muted/5">
            <div className="p-8 border-b border-arch-border">
               <p className="text-arch-eyebrow">Priority Protocols</p>
               <h3 className="text-lg font-black italic text-arch-fg uppercase mt-2">Immediate Start.</h3>
            </div>
            <div className="p-6 space-y-4">
              {dueDecks.length === 0 && <p className="text-arch-muted italic text-[10px] p-4 text-center uppercase tracking-[0.4em]">Library state optimized.</p>}
              {dueDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="w-full border border-arch-border bg-arch-bg p-8 text-left hover:border-arch-fg hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                     <Zap size={24} className="text-arch-fg" />
                  </div>
                  <p className="text-[8px] font-black text-arch-muted uppercase tracking-[0.4em] mb-4">Deck Protocol</p>
                  <h4 className="font-black italic uppercase tracking-tighter text-xl text-arch-fg">{deck.title}.</h4>
                  <div className="mt-8 pt-8 border-t border-arch-border flex items-center justify-between">
                     <span className="text-[8px] font-bold text-arch-fg uppercase tracking-[0.3em] bg-arch-fg/10 px-3 py-1">{deck.due} items due</span>
                     <ArrowRight size={14} className="text-arch-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-10 space-y-10 border-arch-fg/20 bg-arch-fg/[0.02]">
            <div>
               <p className="text-arch-eyebrow text-blue-400">Operator Utilities</p>
               <h3 className="text-lg font-black italic text-arch-fg uppercase mt-2">Quick Deployment.</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => navigate('/dashboard')} className="btn-arch w-full group py-6">
                <span className="inline-flex items-center gap-4">
                   <Command size={18} />
                   Launch Operator
                </span>
              </button>
              <button onClick={() => navigate('/generate')} className="btn-arch-outline w-full py-6 group">
                <span className="inline-flex items-center gap-4">
                   <WandSparkles size={18} />
                   Generate Material
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
