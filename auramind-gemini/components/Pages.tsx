import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Command,
  Copy,
  CreditCard,
  Crown,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Flame,
  Globe,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Mail,
  Maximize2,
  MessageSquare,
  MessageSquareText,
  Mic2,
  MoreVertical,
  MousePointer2,
  Pause,
  Play,
  Plus,
  Radar,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  User,
  Users,
  WandSparkles,
  X,
  Zap,
  GraduationCap,
  Quote,
  Volume2
} from 'lucide-react';
import { Deck, Card, Rating, UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { GeneratedCard, generateFlashcards, generateStudyBuddyResponse } from '../services/geminiService';
import { AuraAgentMode, AuraAgentOutputType, AuraAgentResult, runAuraAgent } from '../services/agentService';
import { useTheme } from '../hooks/useTheme';
import { useIsMobile } from '../hooks/use-mobile';
import MathRichText from './MathRichText';

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

// --- INSIGHTS PAGE (Billion Dollar Refactor) ---
export const DashboardInsightsPage = ({ decks, cards }: { decks: Deck[], cards: Card[] }) => {
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
        <MetricTile label="Study Streak" value="12" detail="Consecutive days of architectural learning." accent="text-blue-400" />
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
             <p className="text-arch-muted text-xs font-medium leading-relaxed italic">The spacing algorithm predicts 94% retention if the current mission-critical backlog is cleared within 24 hours. Focus on the "High Velocity" decks first.</p>
           </div>
           <div className="flex gap-4">
             <button className="btn-arch px-10">Generate Strategy</button>
           </div>
         </div>
      </div>
    </div>
  );
};

// --- PLANNER PAGE (Billion Dollar Refactor) ---
export const DashboardPlannerPage = ({ decks, cards, navigate }: { decks: Deck[], cards: Card[], navigate: any }) => {
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


// --- DECK DETAIL ROUTE ---
export const DeckDetailRoute = ({ decks, cards, navigate, deleteCard, setActiveDeckId }: any) => {
  const { id } = useParams();
  
  useEffect(() => {
    if (id) setActiveDeckId(id);
  }, [id, setActiveDeckId]);

  if (!id) return <Navigate to="/dashboard" replace />;
  const deck = decks.find((d: any) => d.id === id);
  const deckCards = cards.filter((c: any) => c.deckId === id);
  
  if (!deck) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-8 py-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-arch-impact text-[48px] lowercase">{deck.title}.</h1>
          <p className="text-arch-muted mt-4 max-w-xl font-medium tracking-tight whitespace-pre-wrap">{deck.description}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate(`/study/${id}`)} className="btn-arch px-8">Start Study Session</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {deckCards.map((card: any) => (
          <div key={card.id} className="architectural-panel p-8 group relative flex flex-col justify-between min-h-[300px]">
            <button onClick={() => deleteCard(card.id)} className="absolute top-6 right-6 text-arch-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={16} />
            </button>
            <div>
              <p className="text-arch-eyebrow mb-6">Question</p>
              <h3 className="text-lg font-black italic tracking-tight mb-8 text-arch-fg">
                <MathRichText text={card.question} block />
              </h3>
            </div>
            <div className="pt-6 border-t border-arch-border">
              <p className="text-arch-eyebrow mb-3">Answer</p>
              <p className="text-xs text-arch-muted italic line-clamp-3 font-medium">
                <MathRichText text={card.answer} />
              </p>
              <CitationStack card={card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- CHAT ROUTE ---
export const ChatRoute = ({
  navigate,
  createGeneratedDeck,
  createDeckFromCards,
  user,
  decks = [],
  cards = [],
}: {
  navigate: (path: string) => void;
  createGeneratedDeck: (topic: string) => Promise<{ deckTitle: string; cardCount: number } | null>;
  createDeckFromCards: (title: string, description: string, generatedCards: GeneratedCard[]) => Promise<{ deckId: string; deckTitle: string; cardCount: number } | null>;
  user: UserProfile;
  decks?: Deck[];
  cards?: Card[];
}) => {
  const [mode, setMode] = useState<AuraAgentMode>('study_from_anything');
  const [prompt, setPrompt] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [outputType, setOutputType] = useState<AuraAgentOutputType>('all');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AuraAgentResult | null>(null);
  const [status, setStatus] = useState('Stand by');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const exportPayload = useMemo(() => {
    if (!result) return null;
    if (result.researchPack) return result.researchPack;
    if (result.studyBuddy) return {
      response: result.studyBuddy.response,
      followUpQuestions: result.studyBuddy.followUpQuestions,
      flashcards: result.studyBuddy.flashcards ?? [],
    };
    return {
      summary: result.summary,
      flashcards: result.flashcards,
      quiz: result.quiz,
      metadata: result.metadata,
    };
  }, [result]);

  const availableFlashcards = useMemo(() => {
    if (!result) return [];
    if (result.researchPack?.flashcards) return result.researchPack.flashcards;
    if (result.studyBuddy?.flashcards) return result.studyBuddy.flashcards;
    return result.flashcards ?? [];
  }, [result]);

  const availableQuiz = result?.researchPack?.quiz ?? result?.quiz;
  const availableSummary = result?.researchPack?.summary ?? result?.summary;

  const runAgent = async () => {
    if (!prompt.trim() && !sourceText.trim() && !sourceUrl.trim() && !file) return;

    setIsRunning(true);
    setResult(null);
    setError('');
    setSaveStatus('');

    try {
      setStatus(
        mode === 'research_assistant'
          ? 'Researching and building a study pack'
          : mode === 'content_pipeline'
            ? 'Processing source material'
            : mode === 'study_buddy'
              ? 'Tutoring and planning'
              : 'Generating study outputs'
      );

      // Generate user context from mastery stats
      let userContext = `User ${user.name || 'Student'}. ` +
        `Total decks: ${decks.length}. Total cards: ${cards.length}. ` +
        `Current streak: ${user.streak || 0}.`;
      
      const deckMastery = decks.map(d => {
        const deckCards = cards.filter(c => c.deckId === d.id);
        if (!deckCards.length) return null;
        const avgUnderstanding = deckCards.reduce((sum, c) => sum + c.understandingLevel, 0) / deckCards.length;
        return `${d.title} (${Math.round(avgUnderstanding)}% mastery)`;
      }).filter(Boolean);

      if (deckMastery.length) {
        userContext += `\nPerformance context: ${deckMastery.join(', ')}.`;
        userContext += `\nAdapt your responses and difficulty dynamically based on their mastery levels in these topics.`;
      }

      setResult(await runAuraAgent({
        mode,
        prompt,
        sourceText,
        sourceUrl,
        outputType,
        difficulty,
        file,
        userContext,
      }));
    } catch (error: any) {
      setError(error?.message || 'The operator could not complete the run.');
    } finally {
      setStatus('Ready');
      setIsRunning(false);
    }
  };

  const clearWorkspace = () => {
    setPrompt('');
    setSourceText('');
    setSourceUrl('');
    setFile(null);
    setResult(null);
    setError('');
    setSaveStatus('');
    setOutputType('all');
    setDifficulty('medium');
  };

  const copyExportJson = async () => {
    if (!exportPayload) return;
    await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setSaveStatus('Export JSON copied.');
  };

  const downloadExportJson = () => {
    if (!exportPayload) return;
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `auramind-${mode}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSaveStatus('Export JSON downloaded.');
  };

  const saveAsDeck = async () => {
    if (!availableFlashcards.length) return;
    if (user.id === 'guest') {
      setSaveStatus('Sign in to save decks to your library.');
      return;
    }

    setSaveStatus('Saving deck to your library...');
    try {
      const deckTitle = prompt.trim() || result?.title || 'AuraMind Agent Deck';
      const description = availableSummary || `Generated from ${mode.replaceAll('_', ' ')} mode.`;
      const created = await createDeckFromCards(deckTitle, description, availableFlashcards);
      setSaveStatus(
        created
          ? `Saved "${created.deckTitle}" with ${created.cardCount} cards.`
          : 'Could not save the deck.'
      );
    } catch (saveError: any) {
      setSaveStatus(saveError?.message || 'Could not save the deck.');
    }
  };

  const saveResearchDeck = async () => {
    if (!prompt.trim()) return;
    setSaveStatus('Building and saving a researched deck...');
    try {
      const created = await createGeneratedDeck(prompt.trim());
      setSaveStatus(
        created
          ? `Saved "${created.deckTitle}" with ${created.cardCount} cards.`
          : 'Could not create the researched deck.'
      );
    } catch (saveError: any) {
      setSaveStatus(saveError?.message || 'Could not create the researched deck.');
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader
        title="AURA OPERATOR."
        subtitle="A four-mode in-app agent for study generation, tutoring, content processing, and research."
        action={
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
        <div className="architectural-panel p-8 space-y-8">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              ['study_from_anything', 'Study From Anything', 'Turn text, links, or notes into study assets.'],
              ['study_buddy', 'Study Buddy', 'Tutor, quiz, and guide the next learning move.'],
              ['content_pipeline', 'Content Pipeline', 'Process uploaded material into structured exports.'],
              ['research_assistant', 'Research Assistant', 'Research a topic and produce a study pack.'],
            ].map(([value, label, detail]) => (
              <button
                key={value}
                onClick={() => setMode(value as AuraAgentMode)}
                className={`border p-6 text-left transition-all ${mode === value ? 'border-arch-fg bg-arch-muted/10' : 'border-arch-border bg-transparent hover:bg-arch-muted/5'}`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{label}</p>
                <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">{detail}</p>
              </button>
            ))}
          </div>

          <div className="border border-arch-border bg-arch-muted/5 p-10 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-arch-eyebrow mb-3">Mission control</p>
                <h2 className="text-3xl font-black italic lowercase">Give the operator a job.</h2>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-arch-fg text-arch-bg text-[8px] font-black uppercase tracking-[0.4em]">
                <Radar size={12} />
                {status}
              </div>
            </div>

            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                mode === 'research_assistant'
                  ? 'Research a topic, for example: The French Revolution'
                  : mode === 'study_buddy'
                    ? 'Ask the tutor anything, for example: Explain glycolysis simply'
                    : 'Name the goal or topic for this run'
              }
              className="w-full bg-arch-bg border border-arch-border px-6 py-5 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
            />

            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste notes, article text, a lecture transcript, or source material here..."
              className="w-full min-h-[300px] resize-none bg-arch-bg border border-arch-border p-8 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-arch-border bg-arch-bg p-6">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4">
                  <Link2 size={14} className="text-arch-fg" />
                  Source URL
                </div>
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full bg-transparent text-xs font-medium outline-none text-arch-fg"
                />
              </div>
              <label className="border border-arch-border bg-arch-bg p-6 cursor-pointer hover:bg-arch-fg/5 transition-all">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4">
                  <FileUp size={14} className="text-arch-fg" />
                  Uploaded file
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{file ? file.name : 'Upload Source Media'}</p>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv,text/plain,application/pdf"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Mode', value: mode.replaceAll('_', ' '), icon: BrainCircuit },
                { label: 'Output', value: outputType, icon: FileText },
                { label: 'Difficulty', value: difficulty, icon: Target },
                { label: 'Status', value: user.id === 'guest' ? 'Guest' : 'Authorized', icon: ShieldCheck },
              ].map((item) => (
                <div key={item.label} className="border border-arch-border bg-arch-bg p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted">{item.label}</p>
                    <item.icon size={16} className="text-arch-muted" />
                  </div>
                  <p className="font-black italic text-[10px] uppercase mt-6 text-arch-fg">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-arch-eyebrow mb-4">Output type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['all', 'flashcards', 'quiz', 'summary'] as AuraAgentOutputType[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setOutputType(option)}
                      className={`border px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-all ${outputType === option ? 'border-arch-fg bg-arch-fg text-arch-bg' : 'border-arch-border text-arch-muted hover:bg-arch-fg/5 hover:text-arch-fg'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-arch-eyebrow mb-4">Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDifficulty(option)}
                      className={`border px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === option ? 'border-arch-fg bg-arch-fg text-arch-bg' : 'border-arch-border text-arch-muted hover:bg-arch-fg/5 hover:text-arch-fg'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{error}</p>}
            {saveStatus && <p className="text-[10px] text-arch-fg font-black uppercase tracking-[0.4em] italic">{saveStatus}</p>}

            <div className="flex flex-wrap gap-4 pt-8 border-t border-arch-border">
              <button onClick={runAgent} disabled={isRunning || !prompt.trim()} className="btn-arch flex items-center gap-4 disabled:opacity-50">
                {isRunning ? <Loader2 size={18} className="animate-spin" /> : <WandSparkles size={18} />}
                {isRunning ? 'Processing' : 'Run Operator'}
              </button>
              <button onClick={clearWorkspace} className="btn-arch-outline px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em]">
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b border-arch-border">
              <div>
                <p className="text-arch-eyebrow mb-2">Operator output</p>
                <h2 className="text-2xl font-black italic lowercase">Results.</h2>
              </div>
              <BrainCircuit size={18} className="text-arch-muted" />
            </div>

            <div className="border border-arch-border bg-arch-muted/5 p-8 min-h-[400px]">
              {result ? (
                <div className="space-y-8">
                  {availableSummary && <p className="text-xs text-arch-muted italic font-medium leading-relaxed">{availableSummary}</p>}

                  {result.studyBuddy && (
                    <div className="space-y-6">
                      <div className="border border-arch-border bg-arch-bg p-6">
                        <p className="text-xs text-arch-fg font-medium leading-relaxed">{result.studyBuddy.response}</p>
                      </div>
                      {result.studyBuddy.followUpQuestions.length > 0 && (
                        <div className="border border-arch-border bg-arch-bg p-6">
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-fg mb-4 italic">Follow-up inquiries</p>
                          <div className="space-y-3">
                            {result.studyBuddy.followUpQuestions.map((question) => (
                              <p key={question} className="text-[10px] text-arch-muted uppercase tracking-widest font-black">• {question}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {result.researchPack && (
                    <div className="grid gap-6">
                      {[
                        ['Key concepts', result.researchPack.keyConcepts],
                        ['Important facts', result.researchPack.importantFacts],
                        ['Misconceptions', result.researchPack.misconceptions],
                      ].map(([label, items]) => (
                        <div key={label} className="border border-arch-border bg-arch-bg p-6">
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-fg mb-4 italic">{label}</p>
                          <div className="space-y-3">
                            {(items as string[]).map((item) => (
                              <p key={item} className="text-[10px] text-arch-muted uppercase tracking-widest font-black">• {item}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableFlashcards.length > 0 && (
                    <div className="space-y-4">
                      {availableFlashcards.slice(0, 5).map((card, index) => (
                        <div key={`${card.question}-${index}`} className="border border-arch-border bg-arch-bg p-6 group hover:bg-arch-muted/5 transition-all">
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted italic mb-3">Flashcard {(index + 1).toString().padStart(2, '0')}</p>
                          <div className="text-xs font-black italic tracking-tight text-arch-fg">
                            <MathRichText text={card.question} />
                          </div>
                          <div className="text-[10px] text-arch-muted font-medium mt-4 uppercase tracking-widest">
                            <MathRichText text={card.answer} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center text-center">
                  <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic leading-loose">
                    Operator on standby. Execute mode to generate study packs, process source media, or initiate tutoring protocols.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-6">Operator actions</p>
            <div className="space-y-4">
              {[
                ['Save to Library', availableFlashcards.length ? `${availableFlashcards.length} cards queued for local database storage.` : 'Flashcard generation required for library storage.'],
                ['Research Integration', prompt.trim() ? 'Analyze context and produce a comprehensive study environment.' : 'Specify topic to enable research protocols.'],
                ['Export Protocol', exportPayload ? 'Generate structured JSON metadata for archival use.' : 'Execution required for metadata export.'],
              ].map(([title, detail], index) => (
                <div key={title} className="border border-arch-border bg-arch-muted/5 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{title}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">{detail}</p>
                  <div className="mt-8 flex gap-3">
                    {index === 0 && (
                      <button onClick={saveAsDeck} disabled={!availableFlashcards.length} className="btn-arch px-6 py-3 text-[9px] disabled:opacity-40">
                        Commit Deck
                      </button>
                    )}
                    {index === 1 && (
                      <button onClick={saveResearchDeck} disabled={!prompt.trim()} className="btn-arch px-6 py-3 text-[9px] disabled:opacity-40">
                        Run Research
                      </button>
                    )}
                    {index === 2 && (
                      <>
                        <button onClick={copyExportJson} disabled={!exportPayload} className="btn-arch-outline px-6 py-3 text-[9px] disabled:opacity-40">
                          Copy
                        </button>
                        <button onClick={downloadExportJson} disabled={!exportPayload} className="btn-arch-outline px-6 py-3 text-[9px] disabled:opacity-40">
                          Save JSON
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsPage = ({
  user,
  onUpdateUser,
}: {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => Promise<void>;
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [ambientAudio, setAmbientAudio] = useState(true);
  const [operatorMode, setOperatorMode] = useState<'balanced' | 'deep' | 'fast'>('deep');
  const [privacyLock, setPrivacyLock] = useState(true);
  const [sessionLength, setSessionLength] = useState<'25 min' | '45 min' | '90 min'>('45 min');
  const [displayName, setDisplayName] = useState(user.name);
  const [profileStatus, setProfileStatus] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteReasons, setDeleteReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const DELETION_REASONS = [
    'Not using it enough',
    'Found a better alternative',
    'Too complicated to use',
    'Missing features I need',
    'Performance issues',
    'Privacy concerns',
    'Too expensive',
    'Just taking a break',
    'Other',
  ] as const;

  const toggleReason = (reason: string) => {
    setDeleteReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteReasons([]);
    setOtherReason('');
    setDeletePassword('');
    setDeleteStatus('');
  };

  useEffect(() => {
    setDisplayName(user.name);
  }, [user.name]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileStatus('Profile media must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setIsSavingProfile(true);
        setProfileStatus('Saving profile media...');
        try {
          await onUpdateUser({ avatar: reader.result });
          setProfileStatus('Profile media saved to Supabase.');
        } catch (error: any) {
          setProfileStatus(error?.message || 'Could not save profile media.');
        } finally {
          setIsSavingProfile(false);
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleProfileSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileStatus('Display name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus('Saving profile...');
    try {
      await onUpdateUser({ name: trimmedName });
      setProfileStatus('Profile synced with Supabase.');
    } catch (error: any) {
      setProfileStatus(error?.message || 'Could not save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteStatus('Please enter your credential to confirm.');
      return;
    }
    if (deleteReasons.length === 0) {
      setDeleteStatus('Please select at least one reason.');
      return;
    }
    if (deleteReasons.includes('Other') && !otherReason.trim()) {
      setDeleteStatus('Please describe your reason.');
      return;
    }

    setIsDeleting(true);
    setDeleteStatus('Verifying credentials...');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });

      if (authError || !authData.session) {
        setDeleteStatus(authError?.message || 'Invalid credentials.');
        setIsDeleting(false);
        return;
      }

      setDeleteStatus('Deactivating account...');
      const res = await fetch('/api/user-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({
          reasons: deleteReasons,
          otherReason: otherReason.trim() || undefined,
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate account.');
      
      setDeleteStep(3);
      setIsDeleting(false);

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 6000);
    } catch (err: any) {
      setDeleteStatus(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="SETTINGS." subtitle="Configure your neural workspace and profile identity." />

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Profile identity</p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4 italic">Display name</p>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-arch-fg/5 border border-arch-border p-5 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg placeholder:text-arch-muted"
                    placeholder="Enter visual handle"
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4 italic">Electronic mail</p>
                  <div className="w-full bg-arch-bg border border-arch-border/50 p-5 text-xs font-medium text-arch-muted italic">
                    {user.email || 'No email available'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border border-arch-border bg-arch-fg/5 p-8 group">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-32 h-32 object-cover grayscale brightness-125 border border-arch-fg/20" />
                ) : (
                  <div className="w-32 h-32 bg-arch-bg border border-arch-border flex items-center justify-center text-3xl font-black">
                     {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted italic">Neural Signature</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-arch-border flex flex-wrap gap-4">
              <button
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="btn-arch min-w-[200px]"
              >
                {isSavingProfile ? 'Updating' : 'Save Protocol'}
              </button>
              <label className="btn-arch-outline min-w-[200px] cursor-pointer inline-flex items-center justify-center">
                Sync Media
                <input type="file" accept="image/*,image/gif" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {user.avatar && (
                <button
                  onClick={async () => {
                    setIsSavingProfile(true);
                    setProfileStatus('Removing profile media...');
                    try {
                      await onUpdateUser({ avatar: undefined });
                      setProfileStatus('Profile media removed.');
                    } catch (error: any) {
                      setProfileStatus(error?.message || 'Could not remove profile media.');
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                  className="btn-arch-outline px-6 py-4 text-[10px] uppercase tracking-[0.4em] font-black"
                >
                  Remove Media
                </button>
              )}
            </div>
            <p className="text-[9px] text-arch-muted mt-6 uppercase tracking-widest italic leading-relaxed">Identity metadata syncs through localized account protocols. JPG, PNG, WebP, GIF supported.</p>
            {profileStatus && <p className="text-[10px] text-arch-fg font-black mt-4 uppercase tracking-[0.4em] italic">{profileStatus}</p>}
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Thermal Interface</p>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={`border p-6 text-left transition-all ${theme === option ? 'border-arch-fg bg-arch-fg/5' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">{option === resolvedTheme ? 'Active' : 'Standby'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Operator Subsystems</p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {(['balanced', 'deep', 'fast'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setOperatorMode(option as any)}
                  className={`border p-6 text-left transition-all ${operatorMode === option ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Ambient audio surfaces', value: ambientAudio, toggle: () => setAmbientAudio((prev) => !prev), icon: Mic2 },
                { label: 'Privacy lock', value: privacyLock, toggle: () => setPrivacyLock((prev) => !prev), icon: Lock },
              ].map((item) => (
                <button key={item.label} onClick={item.toggle} className="w-full border border-arch-border bg-arch-fg/5 p-6 text-left hover:border-arch-fg transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <item.icon size={16} className="text-arch-fg" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${item.value ? 'text-arch-fg' : 'text-arch-muted italic'}`}>
                      {item.value ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Workflow parameters</p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {(['25 min', '45 min', '90 min'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSessionLength(option as any)}
                  className={`border p-6 text-left transition-all ${sessionLength === option ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">Clock</p>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Session target', value: sessionLength, icon: CalendarDays },
                { label: 'Active theme', value: resolvedTheme, icon: LayoutGrid },
                { label: 'Security posture', value: privacyLock ? 'Hardened' : 'Open', icon: Shield },
              ].map((item) => (
                <div key={item.label} className="border border-arch-border bg-transparent p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <item.icon size={16} className="text-arch-muted" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-arch-muted">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-arch-fg">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Billing & Subscription</p>
            <div className="border border-arch-border bg-arch-fg/5 p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CreditCard size={16} className="text-arch-fg" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">Active Plan: {user.plan}</p>
                    <p className="text-[8px] text-arch-muted italic mt-1 uppercase tracking-widest leading-relaxed">
                      Manage your subscription, update payment methods, and view invoices via Stripe's secure portal.
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Authentication required.');
                    
                    const res = await fetch('/api/stripe-portal', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`
                      }
                    });
                    
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      throw new Error(data.error || 'Failed to open billing portal.');
                    }
                  } catch (err: any) {
                    setProfileStatus(err.message || 'Could not access billing portal.');
                  }
                }}
                className="btn-arch w-full md:w-auto"
              >
                Manage Subscription
              </button>
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">System and legal</p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { label: 'Docs', href: '/docs' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="border border-arch-border bg-arch-fg/5 p-6 text-left hover:border-arch-fg transition-all"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{item.label}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">Access</p>
                </a>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8 border-red-500/20">
            <p className="text-arch-eyebrow mb-8 text-red-500">Danger Zone</p>
            <div className="border border-red-500/20 bg-red-500/5 p-6 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Delete Account</p>
                <p className="text-xs text-arch-muted italic mt-3 leading-relaxed">Deactivate your account for 30 days. Your data is preserved during this period and can be restored via the link sent to your email. After 30 days, your account and all associated data will be permanently deleted.</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="architectural-panel p-10 w-full max-w-xl border-red-500/50 space-y-6 bg-arch-bg">

            {/* STEP 1: Reason Survey */}
            {deleteStep === 1 && (
              <>
                <div className="text-center space-y-4">
                  <AlertTriangle size={36} className="mx-auto text-amber-400" />
                  <h2 className="text-2xl font-black italic lowercase text-arch-fg">Before you go.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    We'd love to understand why you're leaving. Your feedback helps us build a better AuraMind.
                  </p>
                </div>

                <div className="space-y-2 pt-2 max-h-[320px] overflow-y-auto">
                  {DELETION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`w-full text-left border p-4 transition-all flex items-center gap-3 ${
                        deleteReasons.includes(reason)
                          ? 'border-red-500/60 bg-red-500/10'
                          : 'border-arch-border bg-arch-fg/5 hover:border-arch-fg/30'
                      }`}
                    >
                      <div className={`w-5 h-5 border flex-shrink-0 flex items-center justify-center transition-all ${
                        deleteReasons.includes(reason)
                          ? 'border-red-500 bg-red-500'
                          : 'border-arch-border'
                      }`}>
                        {deleteReasons.includes(reason) && <Check size={12} className="text-slate-900 dark:text-white" />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-arch-fg">{reason}</span>
                    </button>
                  ))}
                </div>

                {deleteReasons.includes('Other') && (
                  <textarea
                    autoFocus
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Tell us what we could improve..."
                    rows={3}
                    className="w-full bg-arch-fg/5 border border-arch-border p-4 text-xs font-medium outline-none focus:border-red-500 transition-all text-arch-fg placeholder:text-arch-muted italic resize-none"
                  />
                )}

                <div className="flex gap-4 pt-4 border-t border-arch-border">
                  <button
                    onClick={resetDeleteModal}
                    className="flex-1 btn-arch-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteReasons.length === 0) {
                        setDeleteStatus('Please select at least one reason.');
                        return;
                      }
                      if (deleteReasons.includes('Other') && !otherReason.trim()) {
                        setDeleteStatus('Please describe your reason.');
                        return;
                      }
                      setDeleteStatus('');
                      setDeleteStep(2);
                    }}
                    disabled={deleteReasons.length === 0}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                </div>
                {deleteStatus && <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-red-400 text-center">{deleteStatus}</p>}
              </>
            )}

            {/* STEP 2: Password Confirmation */}
            {deleteStep === 2 && (
              <>
                <div className="text-center space-y-4">
                  <Trash2 size={36} className="mx-auto text-red-500" />
                  <h2 className="text-2xl font-black italic lowercase text-red-500">Final Warning.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    To proceed, re-authenticate below. Your account will be deactivated for 30 days — you'll receive an email with a link to restore it if this was accidental.
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
                  <Mail size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-300/80 font-bold uppercase tracking-widest leading-relaxed">
                    A confirmation email will be sent to <span className="text-amber-200">{user.email}</span> with a restore link valid for 30 days.
                  </p>
                </div>

                <div className="text-left space-y-4 pt-2">
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter your password to confirm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && deletePassword && handleDeleteAccount()}
                    className="w-full bg-arch-fg/5 border border-arch-border p-5 text-sm font-medium outline-none focus:border-red-500 transition-all text-arch-fg placeholder:text-arch-muted italic"
                  />
                  {deleteStatus && <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-red-400">{deleteStatus}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-arch-border">
                  <button
                    onClick={() => { setDeleteStep(1); setDeletePassword(''); setDeleteStatus(''); }}
                    disabled={isDeleting}
                    className="flex-1 btn-arch-outline flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deactivating...' : 'Confirm Deactivation'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Success / Email Sent */}
            {deleteStep === 3 && (
              <>
                <div className="text-center space-y-6 py-6">
                  <div className="w-16 h-16 mx-auto border-2 border-emerald-500 flex items-center justify-center">
                    <Mail size={28} className="text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black italic lowercase text-arch-fg">Account Deactivated.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    We've sent a confirmation email to <span className="text-arch-fg font-bold">{user.email}</span>. If this was a mistake, use the restore link in the email within 30 days to recover your account and all your data.
                  </p>
                  <div className="bg-arch-fg/5 border border-arch-border p-4">
                    <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic">Redirecting you in a few seconds...</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  avatar?: string;
  lastSignIn?: string;
  created: string;
  plan: string;
}

export const AdminConsolePage = ({ user }: { decks: Deck[]; cards: Card[]; user: UserProfile }) => {
  const [panel, setPanel] = useState<'users' | 'analytics' | 'settings' | 'coupons'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [actionError, setActionError] = useState('');
  
  // Coupon Creation State
  const [newCoupon, setNewCoupon] = useState({
    id: '',
    name: '',
    percent_off: '',
    amount_off: '',
    duration: 'once',
    duration_in_months: '3'
  });
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/list-users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setAdminUsers(data.users || []);
    } catch (err: any) {
      setActionError(err.message || 'Could not load users. You may need to configure SUPABASE_SERVICE_ROLE_KEY.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/list-coupons', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setActionError(err.message || 'Could not load coupons.');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCoupon(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const payload = {
        ...newCoupon,
        percent_off: newCoupon.percent_off ? parseFloat(newCoupon.percent_off) : undefined,
        amount_off: newCoupon.amount_off ? parseInt(newCoupon.amount_off) * 100 : undefined, // Convert to cents
        duration_in_months: newCoupon.duration === 'repeating' ? parseInt(newCoupon.duration_in_months) : undefined,
      };

      const res = await fetch('/api/create-coupon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');
      
      setNewCoupon({ id: '', name: '', percent_off: '', amount_off: '', duration: 'once', duration_in_months: '3' });
      fetchCoupons();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm(`Archive coupon ${couponId}?`)) return;
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/delete-coupon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ couponId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchCoupons();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  useEffect(() => {
    if (user.isAdmin) {
      if (panel === 'users') fetchUsers();
      if (panel === 'coupons') fetchCoupons();
    }
  }, [user.isAdmin, panel]);

  if (!user.isAdmin) {
    return (
      <div className="space-y-10 py-4">
        <PageHeader title="ADMIN SUITE." subtitle="Restricted surface for staff roles only." />
        <div className="architectural-panel p-20 text-center space-y-6">
          <ShieldCheck size={64} className="mx-auto text-arch-muted" />
          <h2 className="text-arch-impact text-[32px] lowercase italic">Access Restricted.</h2>
          <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic max-w-xl mx-auto leading-loose">
            This control room is reserved for owners, admins, and moderators with elevated system permissions.
          </p>
          <button onClick={() => window.history.back()} className="btn-arch mt-8">Return to Base</button>
        </div>
      </div>
    );
  }

  const handleToggleAdmin = async (targetId: string, currentState: boolean) => {
    setActionError('');
    const previousUsers = [...adminUsers];
    // Optimistic update
    setAdminUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, isAdmin: !currentState } : u));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      
      const res = await fetch('/api/toggle-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetUserId: targetId, makeAdmin: !currentState })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err: any) {
      setActionError(err.message || 'Failed to toggle admin status');
      setAdminUsers(previousUsers); // Revert
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="ADMIN SUITE." subtitle="User management and network control room." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricTile label="Total Users" value={adminUsers.length || '--'} detail="Registered accounts." />
        <MetricTile label="Admins" value={adminUsers.filter(u => u.isAdmin).length || '--'} detail="Elevated roles." />
        <MetricTile label="System Status" value="Online" detail="APIs operational." accent="text-emerald-400" />
        <MetricTile label="Latency" value="24ms" detail="Global edge routing." />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          ['users', 'User Management'],
          ['coupons', 'Promo Codes'],
          ['analytics', 'Analytics (Mock)'],
          ['settings', 'Platform Config'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setPanel(value as any)}
            className={`border p-6 text-left transition-all ${panel === value ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{label}</p>
          </button>
        ))}
      </div>

      <div className="architectural-panel p-8">
        <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-arch-border">
          <div>
            <p className="text-arch-eyebrow mb-2">Workspace Detail</p>
            <h2 className="text-3xl font-black italic lowercase">{panel} view.</h2>
          </div>
          <Crown size={18} className="text-arch-fg" />
        </div>

        {panel === 'users' && (
          <div className="space-y-6">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs font-black uppercase tracking-widest text-red-500">
                {actionError}
              </div>
            )}
            
            {loadingUsers && !adminUsers.length ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-arch-muted" size={24} /></div>
            ) : (
              <div className="border border-arch-border overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-arch-border bg-arch-fg/5">
                      {['User', 'Email', 'Joined', 'Plan', 'Role', 'Actions'].map((h) => (
                        <th key={h} className="p-5 text-[9px] font-black uppercase tracking-[0.4em] text-arch-muted whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-arch-border last:border-0 hover:bg-arch-fg/[0.02]">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-arch-fg/10 flex items-center justify-center overflow-hidden border border-arch-border">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover grayscale" /> : <span className="text-[10px] font-black">{u.name?.charAt(0) || '?'}</span>}
                            </div>
                            <span className="text-xs font-bold text-arch-fg">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-xs text-arch-muted italic tracking-widest">{u.email}</td>
                        <td className="p-5 text-[10px] text-arch-muted uppercase tracking-widest">
                          {new Date(u.created).toLocaleDateString()}
                        </td>
                        <td className="p-5">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-arch-fg/10 px-3 py-1 border border-arch-border">
                            {u.plan}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${u.isAdmin ? 'text-emerald-400' : 'text-arch-muted'}`}>
                            {u.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="p-5">
                          <button 
                            onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                            disabled={u.email === 'matty.cigemp@gmail.com' || u.id === user.id}
                            className="btn-arch-outline px-4 py-2 text-[9px] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {panel === 'coupons' && (
          <div className="space-y-12">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs font-black uppercase tracking-widest text-red-500">
                {actionError}
              </div>
            )}

            {/* Create Coupon Form */}
            <div className="border border-arch-border bg-arch-fg/5 p-8 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Plus size={16} className="text-arch-fg" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Generate Promo Code</p>
              </div>
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Coupon ID (Optional)</p>
                  <input
                    value={newCoupon.id}
                    onChange={(e) => setNewCoupon({...newCoupon, id: e.target.value})}
                    placeholder="WINTER2025"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Internal Name</p>
                  <input
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                    placeholder="Winter Sale"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Percent Off</p>
                    <input
                      type="number"
                      value={newCoupon.percent_off}
                      onChange={(e) => setNewCoupon({...newCoupon, percent_off: e.target.value, amount_off: ''})}
                      placeholder="20"
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Amount ($)</p>
                    <input
                      type="number"
                      value={newCoupon.amount_off}
                      onChange={(e) => setNewCoupon({...newCoupon, amount_off: e.target.value, percent_off: ''})}
                      placeholder="10"
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Duration</p>
                  <select
                    value={newCoupon.duration}
                    onChange={(e) => setNewCoupon({...newCoupon, duration: e.target.value})}
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg appearance-none"
                  >
                    <option value="once">Once</option>
                    <option value="repeating">Repeating</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
                {newCoupon.duration === 'repeating' && (
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Months</p>
                    <input
                      type="number"
                      value={newCoupon.duration_in_months}
                      onChange={(e) => setNewCoupon({...newCoupon, duration_in_months: e.target.value})}
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <button type="submit" disabled={isCreatingCoupon} className="btn-arch w-full">
                    {isCreatingCoupon ? 'Generating...' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Coupons */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Command size={16} className="text-arch-fg" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Active Registries</p>
              </div>
              
              {loadingCoupons && !coupons.length ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-arch-muted" size={24} /></div>
              ) : coupons.length === 0 ? (
                <div className="border border-arch-border bg-arch-fg/5 p-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted italic">No promo codes registered.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border border-arch-border bg-arch-fg/5 p-8 flex justify-between items-start group hover:border-arch-fg transition-all">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-black italic lowercase text-arch-fg">{coupon.id}</span>
                          {!coupon.valid && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-2 py-1 border border-red-500/20">Expired</span>}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-arch-muted italic">
                          {coupon.name || 'Unnamed Protocol'} • {coupon.duration}
                        </p>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-1 italic">Value</p>
                            <p className="text-xs font-black text-arch-fg">
                              {coupon.percent_off ? `${coupon.percent_off}% off` : `$${coupon.amount_off / 100} off`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-1 italic">Redeemed</p>
                            <p className="text-xs font-black text-arch-fg">{coupon.times_redeemed}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-arch-muted hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {panel === 'users' && (
          <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic mt-4">
            * Note: To view and edit all users, ensure you have set SUPABASE_SERVICE_ROLE_KEY in your Vercel Environment Variables.
          </p>
        )}

        {panel !== 'users' && panel !== 'coupons' && (
          <div className="py-20 text-center">
            <h3 className="text-xl font-black text-arch-muted italic lowercase">Module offline.</h3>
            <p className="text-[10px] uppercase tracking-widest text-arch-muted mt-4">This section is currently a placeholder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LegalShell = ({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; body: string }>;
}) => (
  <div className="space-y-10 py-4">
    <PageHeader title={title} subtitle={subtitle} />
    <div className="architectural-panel p-10 space-y-10">
      {sections.map((section) => (
        <section key={section.heading} className="space-y-6 pb-10 border-b border-arch-border last:border-0 last:pb-0">
          <h2 className="text-2xl font-black italic lowercase">{section.heading}.</h2>
          <p className="text-xs text-arch-muted font-medium leading-relaxed uppercase tracking-widest whitespace-pre-wrap">{section.body}</p>
        </section>
      ))}
    </div>
  </div>
);

export const DocsPage = () => (
  <LegalShell
    title="DOCS."
    subtitle="Core product guidance for decks, AI, profiles, settings, and study loops."
    sections={[
      {
        heading: 'Getting Started',
        body: 'Create or generate a deck, open Study Mode, and rate each card after reveal. AuraMind updates spacing based on those ratings so the system gets smarter over time.',
      },
      {
        heading: 'Aura Operator',
        body: 'Use Aura Operator for three flows: research a topic, deploy a generated deck into your library, or create a coaching sequence for the next study session.',
      },
      {
        heading: 'Profiles and Media',
        body: 'Open Settings to update your display name and upload profile media. Images and GIFs are supported and sync through your Supabase-backed account profile.',
      },
      {
        heading: 'Leaderboard and Analytics',
        body: 'Leaderboard rank is derived from actual deck score: mastery, card count, due pressure, and review volume. Insights and admin views are grounded in the current live deck/card data.',
      },
    ]}
  />
);

export const PrivacyPolicyPage = () => (
  <LegalShell
    title="PRIVACY."
    subtitle="How AuraMind handles profile data, study content, and local preferences."
    sections={[
      {
        heading: 'Profile Data',
        body: 'AuraMind stores account identity through Supabase authentication, including account profile metadata such as display name and profile media.',
      },
      {
        heading: 'Study Content',
        body: 'Decks, cards, and review activity are used to power study workflows, analytics, and scheduling. AI generation requests may process the prompts and source content you submit to the configured model provider.',
      },
      {
        heading: 'Local Preferences',
        body: 'Theme selection and tutorial completion state are stored in local browser storage to preserve the experience on the current device.',
      },
      {
        heading: 'Your Control',
        body: 'You can update or remove profile media, change settings, and sign out at any time. If server-side data deletion is required, the Supabase project must support account-level deletion workflows.',
      },
    ]}
  />
);

export const TermsOfServicePage = () => (
  <LegalShell
    title="TERMS."
    subtitle="Basic use terms for accessing AuraMind and its AI-powered study workflows."
    sections={[
      {
        heading: 'Acceptable Use',
        body: 'Use AuraMind for lawful study, research, and content organization. Do not submit harmful, abusive, or unauthorized content into the platform or its connected AI workflows.',
      },
      {
        heading: 'AI Output',
        body: 'AI-generated summaries, decks, and coaching suggestions are assistive tools. You are responsible for reviewing generated content before relying on it for critical decisions or formal academic submissions.',
      },
      {
        heading: 'Accounts and Access',
        body: 'You are responsible for activity performed through your account. Staff-only interfaces, including the admin suite, are restricted to authorized roles.',
      },
      {
        heading: 'Service Changes',
        body: 'AuraMind may evolve features, routes, AI behavior, and interface details over time. Continued use of the service indicates acceptance of the current product experience and terms.',
      },
    ]}
  />
);

// --- RESET PASSWORD PAGE ---
export const ResetPasswordPage = ({ navigate }: any) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Please enter a valid credential (min 6 characters).");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Neural Protocol Updated Successfully. Re-authenticating...");
      navigate('/auth');
    } catch (err: any) {
      alert(err.message || "Failed to update protocol. Please ensure you clicked the latest link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg font-black">
      <div className="architectural-panel p-12 w-full max-w-md relative z-10 space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-arch-impact text-[32px] lowercase italic">Reset Neural Protocol.</h2>
          <p className="text-arch-eyebrow">Set a new identity credential.</p>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="New credential" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-arch-fg/5 border border-arch-border p-5 text-xs font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted italic"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-arch-muted transition-colors hover:text-arch-fg"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn-arch w-full">{loading ? 'Processing...' : 'Protocol Commit'}</button>
        </form>
      </div>
    </div>
  );
};

// --- RESTORE ACCOUNT PAGE ---
export const RestoreAccountPage = ({ navigate }: any) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');

    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid or missing restore link. Please check the link from your email.');
    }
  }, []);

  const handleRestore = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');

    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid restore link.');
      return;
    }

    setStatus('loading');
    setMessage('Restoring your account...');

    try {
      const res = await fetch('/api/restore-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Restoration failed.');
      }

      setStatus('success');
      setMessage(data.message || 'Account restored! You can sign in now.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg font-black">
      <div className="architectural-panel p-12 w-full max-w-md relative z-10 space-y-8 text-center">
        {status === 'idle' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-amber-500 flex items-center justify-center">
              <AlertTriangle size={28} className="text-amber-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic">Restore Account.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              Click the button below to reactivate your AuraMind account and recover all your data.
            </p>
            <button onClick={handleRestore} className="btn-arch w-full">
              Restore My Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
            >
              No thanks, take me home
            </button>
          </>
        )}

        {status === 'loading' && (
          <div className="py-10 space-y-6">
            <Loader2 size={36} className="mx-auto animate-spin text-arch-muted" />
            <p className="text-xs text-arch-muted uppercase tracking-widest italic">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-emerald-500 flex items-center justify-center">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic text-emerald-400">Restored.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
            <button onClick={() => navigate('/auth')} className="btn-arch w-full">
              Sign In Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-red-500 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic text-red-400">Error.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
            <button onClick={() => navigate('/')} className="btn-arch w-full">
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- NOT FOUND PAGE ---
export const NotFoundPage = ({ navigate }: any) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg text-center font-black">
    <div className="space-y-10">
      <h1 className="text-[120px] font-black text-arch-fg/5 select-none leading-none">404.</h1>
      <div className="space-y-4">
        <h2 className="text-arch-impact text-[32px] lowercase italic">Route Not Found.</h2>
        <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic max-w-sm mx-auto">The requested neural pathway does not exist in the current architecture.</p>
      </div>
      <button onClick={() => navigate('/')} className="btn-arch px-12">Return to Base</button>
    </div>
  </div>
);

export const GenerateCardsRoute = ({ activeDeckId, navigate, saveGeneratedCards }: any) => {
  const [sourceText, setSourceText] = useState('');
  const [cardStyle, setCardStyle] = useState<'definition' | 'conceptual' | 'multiple_choice'>('conceptual');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [useThinking, setUseThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) {
      setError('Add some notes or a topic first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cards = await generateFlashcards(sourceText, {
        cardStyle,
        difficulty,
        includeExplanations,
        useThinking,
      });
      setGeneratedCards(cards);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate cards.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCards.length) return;
    if (!activeDeckId) {
      setError('Open a deck first, then save generated cards into it.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveGeneratedCards(generatedCards);
      navigate(`/deck/${activeDeckId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save cards.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-arch-impact text-[48px] lowercase">CARD GENERATOR.</h1>
          <p className="text-arch-eyebrow mt-4">Choose how the AI should make your cards.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-8">
        <form onSubmit={handleGenerate} className="architectural-panel p-8 space-y-8">
          <div>
            <p className="text-arch-eyebrow mb-6">Source Material</p>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste notes, a lecture summary, textbook text, or a topic outline here..."
              className="w-full min-h-[300px] resize-none bg-arch-fg/5 border border-arch-border p-8 text-xs font-medium outline-none focus:border-arch-fg transition-all text-arch-fg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-arch-eyebrow mb-4">Card Style</p>
              <div className="grid gap-2">
                {[
                  ['definition', 'Definition'],
                  ['conceptual', 'Conceptual'],
                  ['multiple_choice', 'Multiple Choice'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCardStyle(value as 'definition' | 'conceptual' | 'multiple_choice')}
                    className={`border p-5 text-left text-[10px] font-black uppercase tracking-widest transition-all ${cardStyle === value ? 'border-arch-fg bg-arch-fg text-arch-bg' : 'border-arch-border text-arch-muted hover:bg-arch-fg/5 hover:text-arch-fg'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-arch-eyebrow mb-4">Difficulty</p>
              <div className="grid gap-2">
                {[
                  ['easy', 'Easy'],
                  ['medium', 'Medium'],
                  ['hard', 'Hard'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value as 'easy' | 'medium' | 'hard')}
                    className={`border p-5 text-left text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === value ? 'border-arch-fg bg-arch-fg text-arch-bg' : 'border-arch-border text-arch-muted hover:bg-arch-fg/5 hover:text-arch-fg'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIncludeExplanations((prev) => !prev)}
              className={`border p-6 text-left transition-all ${includeExplanations ? 'border-arch-fg bg-arch-fg/5' : 'border-arch-border bg-transparent'}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Explanations</p>
              <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] italic mt-3">Add a reason for each answer.</p>
            </button>
            <button
              type="button"
              onClick={() => setUseThinking((prev) => !prev)}
              className={`border p-6 text-left transition-all ${useThinking ? 'border-arch-fg bg-arch-fg/5' : 'border-arch-border bg-transparent'}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Better Quality</p>
              <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] italic mt-3">Use thinking for precision.</p>
            </button>
          </div>

          {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{error}</p>}

          <div className="flex flex-wrap gap-4 pt-4 border-t border-arch-border">
            <button type="submit" disabled={loading} className="btn-arch min-w-[180px]">
              {loading ? 'Processing...' : 'Generate Cards'}
            </button>
            <button type="button" disabled={!generatedCards.length || saving} onClick={handleSave} className="btn-arch-outline min-w-[180px] disabled:opacity-40">
              {saving ? 'Saving...' : activeDeckId ? `Save ${generatedCards.length || ''} Cards` : 'Open a Deck to Save'}
            </button>
          </div>
        </form>

        <div className="architectural-panel p-8">
          <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b border-arch-border">
            <div>
              <p className="text-arch-eyebrow mb-2">Preview</p>
              <h2 className="text-2xl font-black italic lowercase">{generatedCards.length ? `${generatedCards.length} Cards Ready` : 'No Cards Yet'}</h2>
            </div>
          </div>

          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 scrollbar-hide">
            {!generatedCards.length && (
              <div className="border border-arch-border bg-arch-fg/5 p-8 text-arch-muted text-[10px] uppercase tracking-[0.4em] italic text-center">
                Operator standby. Generate to preview output.
              </div>
            )}

            {generatedCards.map((card, index) => (
              <div key={`${card.question}-${index}`} className="border border-arch-border bg-arch-fg/5 p-8 space-y-6 group hover:bg-arch-fg/10 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted italic">Card {(index + 1).toString().padStart(2, '0')}</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-fg">{card.difficulty || difficulty}</span>
                </div>
                <div>
                  <p className="text-arch-eyebrow mb-3">Question</p>
                  <p className="text-sm font-black italic tracking-tight text-arch-fg">
                    <MathRichText text={card.question} block />
                  </p>
                </div>
                <div>
                  <p className="text-arch-eyebrow mb-3">Answer</p>
                  <p className="text-xs text-arch-muted font-medium italic whitespace-pre-wrap">
                    <MathRichText text={card.answer} block />
                  </p>
                </div>
                {includeExplanations && card.explanation && (
                  <div className="pt-6 border-t border-arch-border/50">
                    <p className="text-arch-eyebrow mb-3">Context</p>
                    <p className="text-[10px] text-arch-muted font-medium italic tracking-tight uppercase leading-relaxed">{card.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudyModeRoute = ({
  decks,
  cards,
  navigate,
  setActiveDeckId,
  rateCard,
}: {
  decks: Deck[];
  cards: Card[];
  navigate: (path: string) => void;
  setActiveDeckId: (deckId: string) => void;
  rateCard: (id: string, rating: Rating) => Promise<void> | void;
}) => {
  const { deckId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [voiceQuestions, setVoiceQuestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);
  const reminderTimeoutRef = useRef<number | null>(null);
  const [voiceReminderEnabled, setVoiceReminderEnabled] = useState(false);
  const [voiceReminderMode, setVoiceReminderMode] = useState<'fixed' | 'random'>('random');
  const [voiceReminderMinutes, setVoiceReminderMinutes] = useState(3);
  const [autoListenAfterPrompt, setAutoListenAfterPrompt] = useState(false);
  const VOICE_PREFS_KEY = 'auramind.voiceStudyPrefs';
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (deckId) setActiveDeckId(deckId);
  }, [deckId, setActiveDeckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(VOICE_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        enabled?: boolean;
        mode?: 'fixed' | 'random';
        minutes?: number;
        autoListen?: boolean;
      };
      if (typeof parsed.enabled === 'boolean') setVoiceReminderEnabled(parsed.enabled);
      if (parsed.mode === 'fixed' || parsed.mode === 'random') setVoiceReminderMode(parsed.mode);
      if (typeof parsed.minutes === 'number') setVoiceReminderMinutes(Math.min(60, Math.max(1, Math.round(parsed.minutes))));
      if (typeof parsed.autoListen === 'boolean') setAutoListenAfterPrompt(parsed.autoListen);
    } catch {
      // Ignore malformed local settings and continue with defaults.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      enabled: voiceReminderEnabled,
      mode: voiceReminderMode,
      minutes: voiceReminderMinutes,
      autoListen: autoListenAfterPrompt,
    };
    window.localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(payload));
  }, [voiceReminderEnabled, voiceReminderMode, voiceReminderMinutes, autoListenAfterPrompt]);

  if (!deckId) return <Navigate to="/dashboard" replace />;

  const deck = decks.find((item) => item.id === deckId);
  const dueCards = cards.filter((card) => card.deckId === deckId).sort((a, b) => a.nextReview - b.nextReview);

  if (!deck) return <Navigate to="/dashboard" replace />;

  if (dueCards.length === 0) {
    return (
      <div className="space-y-8 py-4">
        <button onClick={() => navigate(`/deck/${deckId}`)} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Deck
        </button>
        <div className="architectural-panel p-20 text-center space-y-6">
          <Check size={64} className="mx-auto text-arch-fg" />
          <h1 className="text-arch-impact text-[40px] italic lowercase">all caught up.</h1>
          <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic">There are no scheduled cards in this deck right now.</p>
        </div>
      </div>
    );
  }

  const safeCurrentIndex = Math.min(currentIndex, dueCards.length - 1);
  const activeCard = dueCards[safeCurrentIndex];

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceAnswer = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // No-op: recognizer can throw when already stopped.
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startVoiceAnswer = (promptedQuestion?: string) => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice capture is not supported in this browser.');
      return;
    }

    stopVoiceAnswer();
    setVoiceError('');
    setVoiceTranscript('');
    setVoiceFeedback('');
    setVoiceQuestions([]);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError('Voice capture failed. Try again or use manual review.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setVoiceTranscript(transcript);
      setIsCoaching(true);

      try {
        const question = promptedQuestion || activeCard.question;
        const answer = promptedQuestion ? activeCard.answer : activeCard.answer;
        const response = await generateStudyBuddyResponse(
          'Evaluate the learner answer, identify what was correct or missing, and respond like a concise Socratic coach.',
          `Card question: ${question}\nCorrect answer: ${answer}\nLearner answer: ${transcript}`
        );
        setVoiceFeedback(response.response);
        setVoiceQuestions(response.followUpQuestions || []);
      } catch {
        setVoiceFeedback('Voice answer captured, but coaching feedback could not be generated.');
      } finally {
        setIsCoaching(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const getReminderDelayMs = () => {
    const baseMs = Math.max(1, voiceReminderMinutes) * 60_000;
    if (voiceReminderMode === 'fixed') return baseMs;
    const minMs = 45_000;
    const maxMs = Math.max(baseMs, minMs + 15_000);
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  };

  const clearVoiceReminderTimer = () => {
    if (reminderTimeoutRef.current) {
      window.clearTimeout(reminderTimeoutRef.current);
      reminderTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!voiceReminderEnabled || showAnswer) {
      clearVoiceReminderTimer();
      return;
    }

    const schedulePrompt = () => {
      clearVoiceReminderTimer();
      reminderTimeoutRef.current = window.setTimeout(() => {
        speakText(`Flashcard reminder. ${activeCard.question}`);
        if (autoListenAfterPrompt) {
          window.setTimeout(() => startVoiceAnswer(activeCard.question), 1400);
        }
        schedulePrompt();
      }, getReminderDelayMs());
    };

    schedulePrompt();
    return clearVoiceReminderTimer;
  }, [
    activeCard.id,
    activeCard.question,
    autoListenAfterPrompt,
    showAnswer,
    voiceReminderEnabled,
    voiceReminderMode,
    voiceReminderMinutes,
  ]);

  useEffect(() => () => {
    clearVoiceReminderTimer();
    stopVoiceAnswer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleRating = async (rating: Rating) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (rating >= Rating.GOOD) navigator.vibrate(24);
      else navigator.vibrate([14, 30, 14]);
    }
    await rateCard(activeCard.id, rating);
    setShowAnswer(false);
    setVoiceTranscript('');
    setVoiceFeedback('');
    setVoiceQuestions([]);
    setVoiceError('');
    setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return;
      if (event.key === ' ') {
        event.preventDefault();
        setShowAnswer((prev) => !prev);
        return;
      }
      if (!showAnswer) return;
      if (event.key === '1') handleRating(Rating.AGAIN);
      if (event.key === '2') handleRating(Rating.HARD);
      if (event.key === '3') handleRating(Rating.GOOD);
      if (event.key === '4') handleRating(Rating.EASY);
      if (event.key === 'ArrowLeft') handleRating(Rating.AGAIN);
      if (event.key === 'ArrowRight') handleRating(Rating.GOOD);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAnswer, activeCard.id]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !showAnswer) return;
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !showAnswer || touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(delta) < 60) return;
    if (delta > 0) {
      handleRating(Rating.GOOD);
      return;
    }
    handleRating(Rating.AGAIN);
  };

  return (
    <div className={`space-y-10 py-4 ${highContrastMode ? 'contrast-125 saturate-0' : ''}`}>
      <PageHeader
        title="STUDY MODE."
        subtitle={`${deck.title} • ${safeCurrentIndex + 1} of ${dueCards.length} queued`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHighContrastMode((prev) => !prev)}
              aria-label="Toggle high contrast mode"
              className="inline-flex items-center gap-2 border border-arch-border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-arch-fg"
            >
              {highContrastMode ? 'Contrast On' : 'Contrast Off'}
            </button>
            <button onClick={() => navigate(`/deck/${deckId}`)} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Deck
            </button>
          </div>
        }
      />

      <div className="architectural-panel p-10 space-y-10">
        <div className="h-1 bg-arch-fg/10">
          <motion.div className="h-full bg-arch-fg" animate={{ width: `${((safeCurrentIndex + 1) / dueCards.length) * 100}%` }} />
        </div>

        <div
          className="border border-arch-border bg-arch-fg/5 p-12 min-h-[480px] flex flex-col justify-between"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div>
            <p className="text-arch-eyebrow mb-10">{showAnswer ? 'Response sequence' : 'Inquiry protocol'}</p>
            <h2 className="text-4xl font-black leading-tight italic tracking-tighter text-arch-fg">
              <MathRichText text={showAnswer ? activeCard.answer : activeCard.question} block />
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <button aria-label="Read current flashcard aloud" onClick={() => speakText(showAnswer ? activeCard.answer : activeCard.question)} className="inline-flex items-center gap-2 border border-arch-border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">
                <Volume2 size={14} />
                Read Aloud
              </button>
              <button aria-label="Speak answer with voice recognition" onClick={startVoiceAnswer} className="inline-flex items-center gap-2 border border-arch-border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-arch-fg">
                <Mic2 size={14} />
                {isListening ? 'Listening...' : 'Voice Socratic'}
              </button>
              <button
                onClick={() => {
                  setVoiceReminderEnabled((prev) => !prev);
                  setVoiceError('');
                }}
                className={`inline-flex items-center gap-2 border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] ${
                  voiceReminderEnabled ? 'border-arch-fg text-arch-fg bg-arch-fg/10' : 'border-arch-border text-arch-fg'
                }`}
              >
                <Bell size={14} />
                {voiceReminderEnabled ? 'Voice Reminders On' : 'Voice Reminders Off'}
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="border border-arch-border px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-arch-muted flex items-center justify-between">
                Reminder Mode
                <select
                  value={voiceReminderMode}
                  onChange={(event) => setVoiceReminderMode(event.target.value as 'fixed' | 'random')}
                  className="bg-transparent text-arch-fg text-[10px] uppercase tracking-[0.2em] outline-none"
                >
                  <option value="random" className="bg-black text-slate-900 dark:text-white">Random</option>
                  <option value="fixed" className="bg-black text-slate-900 dark:text-white">Fixed</option>
                </select>
              </label>
              <label className="border border-arch-border px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-arch-muted flex items-center justify-between">
                Interval (minutes)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={voiceReminderMinutes}
                  onChange={(event) => setVoiceReminderMinutes(Math.max(1, Number(event.target.value) || 1))}
                  className="w-14 bg-transparent text-right text-arch-fg outline-none"
                />
              </label>
              <button
                onClick={() => setAutoListenAfterPrompt((prev) => !prev)}
                className={`border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] inline-flex items-center justify-center gap-2 ${
                  autoListenAfterPrompt ? 'border-arch-fg text-arch-fg bg-arch-fg/10' : 'border-arch-border text-arch-muted'
                }`}
              >
                <Mic2 size={14} />
                {autoListenAfterPrompt ? 'Auto Listen On' : 'Auto Listen Off'}
              </button>
            </div>
            <CitationStack card={activeCard} />
          </div>

          {!showAnswer ? (
            <button aria-label="Reveal flashcard answer" onClick={() => setShowAnswer(true)} className="btn-arch self-start min-w-[200px]">
              Reveal Answer
            </button>
          ) : (
            <div className="grid sm:grid-cols-4 gap-4 pt-10 border-t border-arch-border/50">
              {[
                { label: 'Again', rating: Rating.AGAIN, tone: 'hover:border-red-500' },
                { label: 'Hard', rating: Rating.HARD, tone: 'hover:border-amber-500' },
                { label: 'Good', rating: Rating.GOOD, tone: 'hover:border-arch-fg' },
                { label: 'Easy', rating: Rating.EASY, tone: 'hover:border-emerald-500' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleRating(option.rating)}
                  aria-label={`Rate card ${option.label}`}
                  className={`border border-arch-border bg-arch-bg px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${option.tone}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {isMobile && showAnswer && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-arch-muted">
              Swipe right = know (Good), swipe left = review (Again)
            </p>
          )}
        </div>

        {(voiceTranscript || voiceFeedback || voiceError || isCoaching) && (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border border-arch-border bg-arch-bg p-6">
              <p className="text-arch-eyebrow">Voice Capture</p>
              <p className="mt-4 text-sm text-arch-fg leading-relaxed">{voiceTranscript || (isListening ? 'Listening for your spoken answer...' : 'No voice response captured yet.')}</p>
              {voiceError && <p className="mt-4 text-xs text-red-400">{voiceError}</p>}
            </div>
            <div className="border border-arch-border bg-arch-bg p-6">
              <p className="text-arch-eyebrow">Socratic Coach</p>
              <p className="mt-4 text-sm text-arch-fg leading-relaxed">{isCoaching ? 'Analyzing your answer and preparing follow-up prompts...' : voiceFeedback || 'Speak an answer to get guided feedback.'}</p>
              {voiceQuestions.length > 0 && (
                <div className="mt-5 space-y-3">
                  {voiceQuestions.map((question) => (
                    <div key={question} className="border border-arch-border bg-arch-fg/[0.03] p-3 text-xs text-arch-muted">
                      {question}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
