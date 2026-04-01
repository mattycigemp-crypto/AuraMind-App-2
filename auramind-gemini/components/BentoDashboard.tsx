import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Deck, UserProfile, ViewState } from '../types';
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Layers,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

interface BentoDashboardProps {
  decks: Deck[];
  cards: Card[];
  onCreateDeck: (title: string, description: string) => void;
  onSelectDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onGenerateDeck: (topic: string) => void;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  onLoadDemoData?: () => void;
  user: UserProfile;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const LivePulse = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 bg-emerald-500" />
  </span>
);

const MiniBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-[3px] w-full bg-arch-fg/5 overflow-hidden">
      <motion.div
        className="h-full bg-arch-fg"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </div>
  );
};

const BentoDashboard: React.FC<BentoDashboardProps> = ({
  decks,
  cards,
  onSelectDeck,
  onGenerateDeck,
  onNavigate,
  user,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const totalCards = cards.length;
    const cardsDue = cards.filter((card) => card.nextReview <= now).length;
    const mastered = cards.filter((card) => card.interval >= 14 && card.repetition >= 3).length;
    const studiedToday = cards.filter((card) => {
      if (!card.lastReviewed) return false;
      const sot = new Date();
      sot.setHours(0, 0, 0, 0);
      return card.lastReviewed >= sot.getTime();
    }).length;

    return {
      totalDecks: decks.length,
      totalCards,
      cardsDue,
      mastered,
      studiedToday,
      retention: totalCards === 0 ? 0 : Math.round((mastered / totalCards) * 100),
    };
  }, [cards, decks.length, now]);

  const deckSnapshots = useMemo(() => {
    return decks.map((deck) => {
      const deckCards = cards.filter((card) => card.deckId === deck.id);
      const due = deckCards.filter((card) => card.nextReview <= now).length;
      const mast = deckCards.filter((card) => card.interval >= 14 && card.repetition >= 3).length;
      const mastery = deckCards.length === 0 ? 0 : Math.round((mast / deckCards.length) * 100);
      const reviews = deckCards.reduce((total, card) => total + (card.repetition || 0), 0);
      return { ...deck, due, mastery, reviews };
    });
  }, [cards, decks, now]);

  const filteredDecks = useMemo(() => {
    return deckSnapshots
      .filter((deck) =>
        `${deck.title} ${deck.description || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (b.due !== a.due) return b.due - a.due;
        if (b.mastery !== a.mastery) return b.mastery - a.mastery;
        return b.cardCount - a.cardCount;
      })
      .slice(0, 6);
  }, [deckSnapshots, searchQuery]);

  const leaderboard = useMemo(() => {
    return deckSnapshots
      .map((deck) => ({
        id: deck.id,
        title: deck.title,
        score: deck.mastery * 10 + deck.reviews * 3 + deck.cardCount * 4 - deck.due * 2,
        mastery: deck.mastery,
        cardCount: deck.cardCount,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [deckSnapshots]);

  const nextDeck = filteredDecks[0];
  const roleLabel = user.email === 'matty.cigemp@gmail.com' ? 'Owner' : user.isAdmin ? 'Admin' : 'Member';

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  })();

  const greeting = `Good ${timeOfDay}, ${user.name?.split(' ')[0] || 'Scholar'}.`;

  return (
    <motion.div
      className="space-y-8 md:space-y-10 py-4 relative"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* HERO HEADER */}
      <motion.header variants={fadeUp} className="relative z-10">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="arch-pill arch-pill-glow">
                <LivePulse />
                Neural Interface
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-arch-muted hidden md:inline">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-arch-fg font-black leading-[0.92] tracking-tight">
              {greeting}
            </h1>
            <p className="max-w-lg text-arch-muted text-sm font-medium leading-relaxed">
              {stats.cardsDue > 0
                ? `You have ${stats.cardsDue} card${stats.cardsDue === 1 ? '' : 's'} due. Your retention sits at ${stats.retention}%.`
                : stats.totalCards > 0
                  ? `All caught up. ${stats.retention}% retention across ${stats.totalCards} cards.`
                  : 'Create your first deck to begin building durable understanding.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full xl:w-auto">
            <div className="relative flex-1 md:min-w-[300px]">
              <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-arch-muted" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="SEARCH LIBRARY..."
                className="w-full bg-arch-bg border border-arch-border py-4 pl-10 sm:pl-12 pr-5 outline-none focus:border-arch-border-bold transition-all font-black text-[10px] tracking-[0.3em] uppercase text-arch-fg placeholder:text-arch-muted"
              />
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="h-[52px] w-full sm:w-[52px] border border-arch-border flex items-center justify-center hover:bg-arch-fg hover:text-arch-bg transition-all shrink-0"
              title="Settings"
            >
              <span className="sm:hidden text-[10px] font-black uppercase tracking-[0.3em] mr-3">Settings</span>
              <Settings size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* LIVE METRICS ROW */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-arch-border border border-arch-border relative z-10">
        {[
          { label: 'Active Decks', value: stats.totalDecks, color: '' },
          { label: 'Total Cards', value: stats.totalCards, color: '' },
          { label: 'Due Now', value: stats.cardsDue, color: stats.cardsDue > 0 ? 'text-amber-400' : '' },
          { label: 'Retention', value: `${stats.retention}%`, color: stats.retention >= 80 ? 'text-emerald-400' : '' },
        ].map((item) => (
          <div key={item.label} className="bg-arch-bg p-4 sm:p-6 lg:p-8 group hover:bg-arch-fg/[0.03] transition-colors">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-arch-muted mb-2 sm:mb-4">{item.label}</p>
            <p className={`text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tighter leading-none ${item.color || 'text-arch-fg'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* HERO OPERATOR + PRIORITY DECK */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-[1px] bg-arch-border border border-arch-border relative z-10">
        {/* AURA OPERATOR */}
        <div className="bg-arch-bg p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[400px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-arch-fg/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-arch-eyebrow">Aura Operator</p>
              <div className="arch-pill">
                <LivePulse />
                Online
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.85] text-arch-fg">
                Research.<br />
                <span className="text-arch-muted">Anything.</span>
              </h2>
              <p className="text-sm text-arch-muted max-w-xl font-medium leading-relaxed">
                Generate study decks from any topic, run AI tutoring sessions, or process notes into structured flashcards.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && prompt.trim()) {
                    setIsGenerating(true);
                    Promise.resolve(onGenerateDeck(prompt.trim())).finally(() => {
                      setPrompt('');
                      setTimeout(() => setIsGenerating(false), 300);
                    });
                  }
                }}
                placeholder="Enter a topic to research..."
                className="flex-1 bg-arch-fg/[0.03] border border-arch-border px-6 py-5 outline-none focus:border-arch-border-bold transition-all font-bold text-sm text-arch-fg placeholder:text-arch-muted"
              />
              <button
                onClick={() => {
                  if (!prompt.trim()) return;
                  setIsGenerating(true);
                  Promise.resolve(onGenerateDeck(prompt.trim())).finally(() => {
                    setPrompt('');
                    setTimeout(() => setIsGenerating(false), 300);
                  });
                }}
                disabled={isGenerating}
                className="btn-arch group flex items-center gap-3 whitespace-nowrap"
              >
                <BrainCircuit size={18} />
                {isGenerating ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-arch-border mt-10 border-t border-arch-border -mx-6 sm:-mx-10 lg:-mx-12 -mb-6 sm:-mb-10 lg:-mb-12">
            {[
              { label: 'Operator', detail: 'Full workspace', icon: Zap, path: '/chat' },
              { label: 'Generate', detail: 'From notes', icon: Plus, path: '/generate' },
              { label: 'Insights', detail: 'Performance', icon: Target, path: '/dashboard/insights' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="bg-arch-bg p-4 sm:p-6 lg:p-8 text-left hover:bg-arch-fg/[0.04] transition-all group/action"
              >
                <div className="flex items-center justify-between mb-3">
                  <item.icon size={16} className="text-arch-muted group-hover/action:text-arch-fg transition-colors" />
                  <ArrowRight size={12} className="text-arch-muted opacity-0 group-hover/action:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-arch-fg">{item.label}</p>
                <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] mt-1">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PRIORITY DECK */}
        <div className="bg-arch-bg p-6 sm:p-10 flex flex-col justify-between relative">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-arch-eyebrow">Priority</p>
              <Clock3 size={14} className="text-arch-muted" />
            </div>

            {nextDeck ? (
              <>
                <div className="space-y-4">
                  <h3 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter leading-none text-arch-fg">
                    {nextDeck.title}
                  </h3>
                  <p className="text-xs text-arch-muted italic line-clamp-3 font-medium leading-relaxed">{nextDeck.description}</p>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-arch-muted">
                    <span>Mastery</span>
                    <span className="text-arch-fg">{nextDeck.mastery}%</span>
                  </div>
                  <MiniBar value={nextDeck.mastery} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border border-arch-border p-4 bg-arch-fg/[0.02]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted">Due</p>
                    <p className="text-2xl font-black italic text-arch-fg mt-1">{nextDeck.due}</p>
                  </div>
                  <div className="border border-arch-border p-4 bg-arch-fg/[0.02]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted">Assets</p>
                    <p className="text-2xl font-black italic text-arch-fg mt-1">{nextDeck.cardCount}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border border-dashed border-arch-border">
                <Sparkles size={28} className="text-arch-muted mb-4" />
                <p className="text-arch-eyebrow">No signals</p>
                <p className="text-xs text-arch-muted italic mt-2">Create a deck to begin.</p>
              </div>
            )}
          </div>

          {nextDeck && (
            <button
              onClick={() => onSelectDeck(nextDeck.id)}
              className="btn-arch w-full mt-6"
            >
              <Zap size={16} />
              Open Priority
            </button>
          )}
        </div>
      </motion.div>

      {/* LIBRARY + LEADERBOARD + WORKSPACE */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 relative z-10">
        {/* LIBRARY */}
        <div className="architectural-panel p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-8 border-b border-arch-border">
            <p className="text-arch-eyebrow">Library</p>
            <button
              onClick={() => navigate('/generate')}
              className="text-arch-eyebrow hover:text-arch-fg flex items-center gap-2 transition-colors"
            >
              Generator <ChevronRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-arch-border" data-testid="decks-list">
            {filteredDecks.map((deck, i) => (
              <motion.button
                key={deck.id}
                onClick={() => onSelectDeck(deck.id)}
                className="bg-arch-bg p-5 sm:p-8 text-left hover:bg-arch-fg/[0.04] transition-all group relative"
                data-testid="deck-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full bg-arch-fg transition-all duration-500" />
                <div className="flex flex-col justify-between h-full space-y-6 min-h-[200px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-arch-muted">
                        {deck.due > 0 ? `${deck.due} due` : 'Clear'}
                      </p>
                      {deck.due > 0 && <div className="h-1.5 w-1.5 bg-amber-400 animate-pulse" />}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-arch-fg leading-tight">{deck.title}</h3>
                    <p className="text-[11px] text-arch-muted line-clamp-2 font-medium leading-relaxed">{deck.description}</p>
                  </div>

                  <div className="space-y-3">
                    <MiniBar value={deck.mastery} />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-arch-muted uppercase tracking-[0.3em]">{deck.mastery}% mastery</span>
                      <span className="text-[9px] font-black text-arch-muted uppercase tracking-[0.3em]">{deck.cardCount} cards</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}

            <button
              onClick={() => navigate('/generate')}
              className="bg-arch-bg p-6 sm:p-8 text-left hover:bg-arch-fg/[0.04] transition-all border-l-0 flex flex-col justify-center items-center min-h-[200px] group"
              data-testid="create-deck-button"
            >
              <div className="w-12 h-12 border border-arch-border flex items-center justify-center group-hover:bg-arch-fg group-hover:text-arch-bg transition-all mb-4">
                <Plus size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-arch-fg">New Collection</p>
              <p className="text-[8px] text-arch-muted uppercase tracking-[0.2em] mt-1">AI-assisted generation</p>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* LEADERBOARD */}
          <div className="architectural-panel overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-8 border-b border-arch-border">
              <p className="text-arch-eyebrow">Leaderboard</p>
              <Trophy size={14} className="text-arch-muted" />
            </div>
            <div data-testid="leaderboard-section">
              {leaderboard.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => onSelectDeck(entry.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-8 py-4 sm:py-5 border-b border-arch-border hover:bg-arch-fg/[0.03] transition-all text-left group"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <span className={`text-sm font-black italic ${i === 0 ? 'text-arch-fg' : 'text-arch-muted'}`}>
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-arch-fg truncate group-hover:tracking-[0.2em] transition-all">
                        {entry.title}
                      </p>
                      <p className="text-[8px] text-arch-muted mt-1 uppercase tracking-[0.3em]">
                        {entry.cardCount} cards · {entry.mastery}%
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-black italic text-arch-fg shrink-0">{entry.score}</p>
                </button>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[10px] text-arch-muted uppercase tracking-[0.4em] italic">No decks ranked yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* TODAY'S ACTIVITY */}
          <div className="architectural-panel p-5 sm:p-8">
            <p className="text-arch-eyebrow mb-5 sm:mb-6">Today</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-arch-border p-5 bg-arch-fg/[0.02]">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-2">Studied</p>
                <p className="text-3xl font-black italic text-arch-fg">{stats.studiedToday}</p>
                <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] mt-1">Cards today</p>
              </div>
              <div className="border border-arch-border p-5 bg-arch-fg/[0.02]">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-2">Mastered</p>
                <p className="text-3xl font-black italic text-emerald-400">{stats.mastered}</p>
                <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] mt-1">Total mastered</p>
              </div>
            </div>
          </div>

          {/* QUICK NAV */}
          <div className="architectural-panel overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-8 border-b border-arch-border">
              <p className="text-arch-eyebrow">Workspace</p>
              <Shield size={14} className="text-arch-muted" />
            </div>
            {[
              {
                title: 'Study Plan',
                detail: 'Schedule & review.',
                icon: Layers,
                path: '/dashboard/planner',
              },
              {
                title: 'Settings',
                detail: 'Preferences.',
                icon: Settings,
                path: '/settings',
              },
              ...(user.isAdmin
                ? [{
                  title: 'Admin Suite',
                  detail: 'Moderation.',
                  icon: Shield,
                  path: '/admin/vault',
                }]
                : []),
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 sm:gap-5 px-5 sm:px-8 py-4 sm:py-5 border-b border-arch-border hover:bg-arch-fg hover:text-arch-bg transition-all duration-300 group text-left"
              >
                <item.icon size={18} className="text-arch-muted group-hover:text-inherit transition-colors shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">{item.title}</p>
                  <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 group-hover:opacity-70 mt-0.5">{item.detail}</p>
                </div>
                <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BentoDashboard;
