import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Deck, UserProfile, ViewState } from '../types';
import OnboardingTutorial from './OnboardingTutorial';
import { enrollInBetaChallenge, getBetaChallenge, getChallengeProgress, parseImportText } from '../services/roadmapService';
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Clock3,
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
  Activity,
  Cpu,
  Globe,
  ZapOff,
  GraduationCap,
  Upload,
  Rocket
} from 'lucide-react';

interface BentoDashboardProps {
  decks: Deck[];
  cards: Card[];
  onCreateDeck: (title: string, description: string) => void;
  onSelectDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onGenerateDeck: (topic: string) => void;
  onImportDeck: (title: string, description: string, cards: Array<{ question: string; answer: string; citations?: Card['citations']; sourceLabel?: string; sourceType?: Card['sourceType']; }>) => Promise<{ deckId: string; deckTitle: string; cardCount: number } | null>;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  onLoadDemoData?: () => void;
  user: UserProfile;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const LivePulse = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75 rounded-full" />
    <span className="relative inline-flex h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
  </span>
);

const MiniBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-1 w-full bg-white/[0.03] overflow-hidden rounded-full">
      <motion.div
        className="h-full bg-white/20"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      />
    </div>
  );
};

const BentoDashboard: React.FC<BentoDashboardProps> = ({
  decks,
  cards,
  onSelectDeck,
  onGenerateDeck,
  onImportDeck,
  onNavigate,
  onLoadDemoData,
  user,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [importTitle, setImportTitle] = useState('Imported deck');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [challenge, setChallenge] = useState(() => getBetaChallenge(user.id));

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
        return (b.cardCount || 0) - (a.cardCount || 0);
      })
      .slice(0, 6);
  }, [deckSnapshots, searchQuery]);

  const leaderboard = useMemo(() => {
    return deckSnapshots
      .map((deck) => ({
        id: deck.id,
        title: deck.title,
        score: deck.mastery * 10 + deck.reviews * 3 + (deck.cardCount || 0) * 4 - deck.due * 2,
        mastery: deck.mastery,
        cardCount: deck.cardCount || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [deckSnapshots]);

  const nextDeck = filteredDecks[0];
  const challengeProgress = getChallengeProgress(challenge, user.streak);
  const xpToday = cards.filter((card) => {
    if (!card.lastReviewed) return false;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return card.lastReviewed >= startOfDay.getTime();
  }).length * 12;
  const achievementCount = [
    stats.totalDecks >= 1,
    stats.totalCards >= 20,
    stats.retention >= 60,
    (user.streak || 0) >= 3,
  ].filter(Boolean).length;
  
  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  })();

  const greeting = `Good ${timeOfDay}, ${user.name?.split(' ')[0] || 'Scholar'}.`;

  const handleImport = async () => {
    try {
      const parsed = parseImportText(importText, importTitle.trim() || 'Imported deck');
      const created = await onImportDeck(parsed.title, parsed.description, parsed.cards);
      if (created) {
        setImportStatus(`Imported ${created.cardCount} cards into ${created.deckTitle}.`);
        setImportText('');
      }
    } catch (error: any) {
      setImportStatus(error?.message || 'Import failed.');
    }
  };

  const handleBetaJoin = () => {
    const nextChallenge = enrollInBetaChallenge(user.id);
    setChallenge(nextChallenge);
  };

  return (
    <>
      <motion.div
        className="space-y-12 relative pb-20"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
      {/* HEADER SECTION */}
      <motion.header data-testid="dashboard-header" variants={fadeUp} className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="arch-pill bg-white/[0.03] border-white/5 text-white/50 px-4 py-1.5 backdrop-blur-md">
              <LivePulse />
              <span className="text-[10px] uppercase font-black tracking-[0.2em]">Neural Active</span>
            </div>
          </div>
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-white leading-none tracking-tightest"
            >
              {greeting}
            </motion.h1>
            <p className="text-white/40 text-sm font-medium tracking-wide">
              {stats.cardsDue > 0
                ? `You have ${stats.cardsDue} card${stats.cardsDue === 1 ? '' : 's'} due for review.`
                : 'Your knowledge baseline is stable. All decks processed.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/50 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH NEURAL BASE..."
              className="w-full bg-white/[0.03] border border-white/5 py-4 pl-14 pr-6 outline-none focus:border-white/20 transition-all font-black text-[10px] tracking-[0.3em] uppercase text-white placeholder:text-white/20 rounded-2xl backdrop-blur-xl"
            />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-14 h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group backdrop-blur-xl"
          >
            <Settings size={20} className="text-white/40 group-hover:text-white group-hover:rotate-45 transition-all" />
          </button>
        </div>
      </motion.header>

      {/* CORE METRICS GRID */}
      <motion.div data-testid="progress-snapshot" variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Neural Collections', value: stats.totalDecks, icon: Globe, detail: 'Active units' },
          { label: 'Knowledge Assets', value: stats.totalCards, icon: Activity, detail: 'Total data points' },
          { label: 'Priority Signals', value: stats.cardsDue, icon: Zap, color: 'text-amber-400', detail: 'Review needed' },
          { label: 'Retention Rate', value: `${stats.retention}%`, icon: Target, color: 'text-emerald-400', detail: 'Baseline stability' },
        ].map((item, i) => (
          <div key={item.label} data-testid="progress-bar" className="group relative">
            <div className="absolute inset-0 bg-white/[0.01] rounded-[32px] blur-sm translate-y-2 group-hover:translate-y-4 transition-transform opacity-0 group-hover:opacity-100" />
            <div className="relative bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden backdrop-blur-xl group-hover:border-white/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all" />
              <div className="flex items-center justify-between mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{item.label}</p>
                <item.icon size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
              <div className="space-y-1">
                <p className={`text-3xl sm:text-4xl lg:text-5xl font-display font-black italic leading-none ${item.color || 'text-white'}`}>
                  {item.value}
                </p>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* PRIMARY INTERFACE: OPERATOR + PRIORITY */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        {/* AURA OPERATOR - 7 COLUMNS */}
        <motion.div data-testid="ai-generate-section" variants={fadeUp} className="xl:col-span-7 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 sm:p-12 relative overflow-hidden group backdrop-blur-xl border-l border-t border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-purple-600/10 transition-colors duration-1000" />
          
          <div className="relative z-10 space-y-12 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-center">
                  <Cpu size={20} className="text-white/40" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Command Center</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-0.5 italic">Aura Mk.4</p>
                </div>
              </div>
              <div className="arch-pill bg-white/[0.06] border-white/10 px-3 py-1">
                <LivePulse />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Ready</span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl sm:text-6xl font-display font-black italic uppercase tracking-tightest leading-[0.85] text-white">
                GENERATE.<br />
                <span className="text-white/20">ACCELERATE.</span>
              </h2>
              <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
                Execute deep neural extraction. Convert complex signals into structured knowledge assets through any topic or set of notes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group/input">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && prompt.trim()) {
                      setIsGenerating(true);
                      Promise.resolve(onGenerateDeck(prompt.trim())).finally(() => {
                        setPrompt('');
                        setTimeout(() => setIsGenerating(false), 300);
                      });
                    }
                  }}
                  placeholder="Incept a new topic..."
                  className="w-full bg-white/[0.03] border border-white/5 px-8 py-5 outline-none focus:border-white/20 group-hover/input:bg-white/[0.05] transition-all font-bold text-sm text-white placeholder:text-white/20 rounded-2xl"
                />
              </div>
              <button
                data-testid="create-deck-button"
                onClick={() => {
                  if (!prompt.trim()) return;
                  setIsGenerating(true);
                  Promise.resolve(onGenerateDeck(prompt.trim())).finally(() => {
                    setPrompt('');
                    setTimeout(() => setIsGenerating(false), 300);
                  });
                }}
                disabled={isGenerating}
                className="bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] px-10 py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              >
                <BrainCircuit size={16} />
                {isGenerating ? 'PROCESSING...' : 'EXECUTE'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* PRIORITY VECTOR - 5 COLUMNS */}
        <motion.div variants={fadeUp} className="xl:col-span-5 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 sm:p-10 relative overflow-hidden group backdrop-blur-xl group flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock3 size={16} className="text-white/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Priority Stream</p>
              </div>
              <div className="text-[10px] font-black uppercase text-white/20">01 / {filteredDecks.length}</div>
            </div>

            {nextDeck ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="text-3xl lg:text-5xl font-display font-black italic uppercase tracking-tightest leading-none text-white transition-all group-hover:translate-x-2 duration-500">
                    {nextDeck.title}
                  </h3>
                  <p className="text-xs text-white/30 italic line-clamp-2 leading-relaxed font-medium">
                    {nextDeck.description || "Experimental neural collection focused on core principles."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Assets</p>
                    <p className="text-3xl font-display font-black italic text-white leading-none">{nextDeck.cardCount || 0}</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Mastery</p>
                    <p className="text-3xl font-display font-black italic text-white leading-none">{nextDeck.mastery}%</p>
                    <div className="mt-3">
                      <MiniBar value={nextDeck.mastery} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center">
                  <ZapOff size={24} className="text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">No Signals Detected</p>
                  <p className="text-[9px] text-white/10 uppercase tracking-widest italic">Create a collection to start.</p>
                </div>
              </div>
            )}
          </div>

          {nextDeck && (
            <button
              onClick={() => onSelectDeck(nextDeck.id)}
              className="w-full mt-10 py-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white/80 hover:bg-white hover:text-black hover:border-white transition-all duration-500 font-black uppercase text-[10px] tracking-[0.3em] group/btn"
            >
              <Zap size={14} className="group-hover/btn:fill-current" />
              Initialize Session
              <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </button>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        <motion.div variants={fadeUp} className="xl:col-span-4 bg-white/[0.02] border border-white/5 rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Aha Moment</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-white mt-2">Start in 30 seconds</h3>
            </div>
            <Rocket size={18} className="text-white/30" />
          </div>
          <p className="text-sm text-white/40 leading-relaxed">
            Load sample decks, take the fast tour, and drop straight into a study session without setup friction.
          </p>
          <div className="grid gap-3">
            <button
              onClick={() => onLoadDemoData?.()}
              className="w-full bg-white text-black rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Load Sample Decks
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-white/[0.04] border border-white/10 text-white rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Start 30s Tour
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-4 bg-white/[0.02] border border-white/5 rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">One-Click Import</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-white mt-2">Anki / Quizlet</h3>
            </div>
            <Upload size={18} className="text-white/30" />
          </div>
          <input
            type="text"
            value={importTitle}
            onChange={(event) => setImportTitle(event.target.value)}
            placeholder="Deck title"
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20"
          />
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={"Paste `term<TAB>definition`, `front::back`, or Q:/A: blocks"}
            className="w-full min-h-[170px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20"
          />
          <button
            onClick={handleImport}
            className="w-full bg-white/[0.04] border border-white/10 text-white rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Import Deck
          </button>
          {importStatus && <p className="text-xs text-white/45">{importStatus}</p>}
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-4 bg-white/[0.02] border border-white/5 rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Retention Battery</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-white mt-2">Momentum Layer</h3>
            </div>
            <Flame size={18} className="text-amber-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Streak</p>
              <p className="mt-2 text-2xl font-black text-white">{user.streak || 0}d</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">XP Today</p>
              <p className="mt-2 text-2xl font-black text-white">{xpToday}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Badges</p>
              <p className="mt-2 text-2xl font-black text-white">{achievementCount}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Beta Challenge</p>
              <span className="text-[10px] text-white/40">{challengeProgress.completedDays}/{challengeProgress.targetDays}</span>
            </div>
            <p className="text-sm text-white/45 mt-3 leading-relaxed">
              {challengeProgress.active
                ? `${challengeProgress.remainingDays === 0 ? 'Challenge complete.' : `${challengeProgress.remainingDays} day${challengeProgress.remainingDays === 1 ? '' : 's'} left`} Keep studying and share progress with med, law, and cert communities.`
                : 'Join the high-stakes student challenge and build a 7-day study streak.'}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleBetaJoin}
                className="flex-1 bg-white text-black rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
              >
                {challengeProgress.active ? 'Refresh Challenge' : 'Join Challenge'}
              </button>
              <button
                onClick={() => navigate('/dashboard/professor')}
                className="flex-1 bg-white/[0.04] border border-white/10 text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
              >
                Professor View
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECONDARY GRID: LIBRARY, LEADERBOARD, TASKS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        {/* LIBRARY SECTION - 8 COLUMNS */}
        <motion.div variants={fadeUp} className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-white/20" />
              <p className="text-arch-eyebrow uppercase">Neural Library</p>
            </div>
            <button 
              onClick={() => navigate('/generate')}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors flex items-center gap-2 group"
            >
              Expand All
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div data-testid="decks-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDecks.map((deck, i) => (
              <motion.button
                key={deck.id}
                data-testid="deck-card"
                onClick={() => onSelectDeck(deck.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="group relative bg-white/[0.02] border border-white/5 p-7 rounded-[32px] text-left hover:bg-white/[0.04] transition-all hover:border-white/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] -mr-8 -mt-8 rounded-full blur-xl group-hover:bg-white/[0.03] transition-all" />
                <div className="flex flex-col justify-between h-full min-h-[160px] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="arch-pill bg-white/[0.03] text-white/30 border-white/5 py-1 px-3">
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {deck.due > 0 ? `${deck.due} SIGNAL` : 'STABLE'}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-white/5 group-hover:text-white transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-display font-black italic uppercase tracking-tight text-white line-clamp-1">{deck.title}</h3>
                      <p className="text-[11px] text-white/30 font-medium leading-relaxed line-clamp-2 italic">{deck.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
                      <span>Sync: {deck.mastery}%</span>
                      <span>Total: {deck.cardCount || 0}</span>
                    </div>
                    <MiniBar value={deck.mastery} />
                  </div>
                </div>
              </motion.button>
            ))}

            <button
              onClick={() => navigate('/generate')}
              className="bg-white/[0.01] border border-white/5 border-dashed rounded-[32px] p-7 flex flex-col items-center justify-center min-h-[200px] group hover:bg-white/[0.03] hover:border-white/20 transition-all gap-4"
            >
              <div className="w-12 h-12 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Incept New</p>
                <p className="text-[8px] text-white/10 uppercase tracking-widest mt-1">Manual or AI-driven</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* SIDEBAR TOOLS - 4 COLUMNS */}
        <div className="xl:col-span-4 space-y-8">
          {/* LEADERBOARD */}
          <motion.div data-testid="leaderboard-section" variants={fadeUp} className="bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl border-l border-t border-white/10 p-2">
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-3">
                <Trophy size={16} className="text-white/20" />
                <p className="text-arch-eyebrow uppercase">Neural Ranking</p>
              </div>
              <Activity size={14} className="text-white/10" />
            </div>
            
            <div className="space-y-1 mt-4">
              {leaderboard.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => onSelectDeck(entry.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.03] transition-all group rounded-3xl"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black italic w-5 ${i === 0 ? 'text-white' : 'text-white/20'}`}>
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                        {entry.title}
                      </p>
                      <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mt-0.5 whitespace-nowrap">
                        {entry.cardCount} units · {entry.mastery}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-black italic text-white">{entry.score}</p>
                    <p className="text-[7px] text-white/10 font-bold uppercase tracking-widest">PTS</p>
                  </div>
                </button>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] italic">Aura Offline.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* QUICK ACCESS */}
          <motion.div variants={fadeUp} className="bg-white/[0.02] border border-white/5 rounded-[40px] p-2 overflow-hidden backdrop-blur-xl border-l border-t border-white/10">
            <div className="p-6 pb-2 flex items-center gap-3">
              <Sparkles size={16} className="text-white/20" />
              <p className="text-arch-eyebrow uppercase">System Map</p>
            </div>
            <div className="space-y-1 mt-4">
              {[
                { title: 'Neural Chat', icon: BrainCircuit, path: '/chat', detail: 'Study Operator' },
                { title: 'Daily Planner', icon: Target, path: '/dashboard/planner', detail: 'Target Scheduling' },
                { title: 'Admin Vault', icon: Shield, path: '/admin/vault', isHidden: !user.isAdmin, detail: 'System Admin' },
              ].filter(i => !i.isHidden).map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-5 px-6 py-5 hover:bg-white text-white/60 hover:text-black transition-all duration-500 group rounded-3xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-black/5 group-hover:border-black/10 transition-all shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{item.title}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-1">{item.detail}</p>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      </motion.div>
      <OnboardingTutorial isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={() => setShowOnboarding(false)} />
    </>
  );
};

export default BentoDashboard;
