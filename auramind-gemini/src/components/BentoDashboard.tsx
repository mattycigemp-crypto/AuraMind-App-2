import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Deck, UserProfile, ViewState } from '../types';
import OnboardingTutorial from './OnboardingTutorial';
import { generateFlashcards } from '../services/deepseekService';
import ActivityHeatmap from './ActivityHeatmap';
import { extractStudyAssetText } from '../services/documentImportService';
import {
  enrollInBetaChallenge,
  getBetaChallenge,
  getChallengeProgress,
  parseImportText,
  parseNotionImportText,
  parseObsidianMarkdownImport,
  parseApkgFile,
} from '../services/roadmapService';
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
    <div className="h-1 w-full bg-black/5 dark:bg-white/ overflow-hidden rounded-full">
      <motion.div
        className="h-full bg-black/5 dark:bg-white/"
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
  const [importMode, setImportMode] = useState<'anki_quizlet' | 'notion' | 'obsidian' | 'anki_apkg'>('anki_quizlet');
  const [isOptimizingImport, setIsOptimizingImport] = useState(false);
  const [isDraggingImportFile, setIsDraggingImportFile] = useState(false);
  const [isProcessingStudyAsset, setIsProcessingStudyAsset] = useState(false);
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
  const streakFreezes = Math.floor((user.streak || 0) / 7);
  const daysIntoFreezeCycle = (user.streak || 0) % 7;
  const daysToNextFreeze = daysIntoFreezeCycle === 0 ? 7 : 7 - daysIntoFreezeCycle;
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
      const deckTitle = importTitle.trim() || 'Imported deck';
      const parser =
        importMode === 'notion'
          ? parseNotionImportText
          : importMode === 'obsidian'
            ? parseObsidianMarkdownImport
            : parseImportText;
      const parsed = parser(importText, deckTitle);
      const created = await onImportDeck(parsed.title, parsed.description, parsed.cards);
      if (created) {
        setImportStatus(`Imported ${created.cardCount} cards into ${created.deckTitle}.`);
        setImportText('');
      }
    } catch (error: any) {
      setImportStatus(error?.message || 'Import failed.');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (importMode === 'anki_apkg') {
        const deckTitle = (importTitle.trim() || file.name.replace(/\.[^.]+$/, '') || 'Anki import').trim();
        const parsed = await parseApkgFile(file, deckTitle);
        const created = await onImportDeck(parsed.title, parsed.description, parsed.cards);
        if (created) {
          setImportStatus(`Imported ${created.cardCount} cards from ${file.name} into ${created.deckTitle}.`);
          setImportText('');
        }
        return;
      }

      const text = await file.text();
      setImportText(text);
      const deckTitle = (importTitle.trim() || file.name.replace(/\.[^.]+$/, '') || 'Imported deck').trim();
      const parser =
        importMode === 'notion'
          ? parseNotionImportText
          : importMode === 'obsidian'
            ? parseObsidianMarkdownImport
            : parseImportText;
      const parsed = parser(text, deckTitle);
      const created = await onImportDeck(parsed.title, parsed.description, parsed.cards);
      if (created) {
        setImportStatus(`Imported ${created.cardCount} cards from ${file.name} into ${created.deckTitle}.`);
        setImportText('');
      }
    } catch {
      setImportStatus('Could not import this file. If this is APKG, confirm it is a valid Anki package with notes.');
    } finally {
      event.target.value = '';
    }
  };

  const handleStudyAssetUpload = async (file: File) => {
    try {
      setIsProcessingStudyAsset(true);
      setImportStatus(`Reading ${file.name}...`);
      const sourceText = await extractStudyAssetText(file);
      if (!sourceText.trim()) {
        setImportStatus('No readable content found in this file.');
        return;
      }

      setImportText(sourceText.slice(0, 12000));
      setImportStatus('Generating flashcards from uploaded file...');
      const generated = await generateFlashcards(
        `Preserve equations and LaTeX-style notation exactly when present.\n\n${sourceText.slice(0, 28000)}`,
        {
          cardStyle: 'conceptual',
          difficulty: 'medium',
          includeExplanations: false,
        }
      );

      if (!generated.length) {
        setImportStatus('No cards generated from this upload.');
        return;
      }

      const baseTitle = importTitle.trim() || file.name.replace(/\.[^.]+$/, '') || 'Study asset import';
      const created = await onImportDeck(
        `${baseTitle} (Auto Import)`,
        `Auto-generated from ${file.name}.`,
        generated.map((card, index) => ({
          question: card.question,
          answer: card.answer,
          sourceLabel: `Upload: ${file.name}`,
          sourceType: 'import',
          citations: [
            {
              id: `upload-${index + 1}`,
              label: file.name,
              excerpt: `${card.question} ${card.answer}`.slice(0, 220),
              locator: `Generated card ${index + 1}`,
              sourceType: 'import',
            },
          ],
        }))
      );

      if (created) {
        setImportStatus(`Auto-imported ${created.cardCount} cards from ${file.name} into ${created.deckTitle}.`);
      }
    } catch (error: any) {
      setImportStatus(error?.message || 'Failed to process this study asset.');
    } finally {
      setIsProcessingStudyAsset(false);
    }
  };

  const handleAiOptimizeImport = async () => {
    const source = importText.trim();
    if (!source) {
      setImportStatus('Paste source content before running AI optimize.');
      return;
    }

    try {
      setIsOptimizingImport(true);
      setImportStatus('Running AI optimization...');
      const optimizedCards = await generateFlashcards(source, {
        cardStyle: 'conceptual',
        difficulty: 'medium',
        includeExplanations: false,
      });
      if (!optimizedCards.length) {
        setImportStatus('AI optimize returned no cards. Try adding more source text.');
        return;
      }

      const optimizedTitle = `${(importTitle.trim() || 'Imported deck')} (AI Optimized)`;
      const created = await onImportDeck(
        optimizedTitle,
        'AI-optimized import from provided source text.',
        optimizedCards.map((card) => ({
          question: card.question,
          answer: card.answer,
          sourceLabel: 'AI optimized import',
          sourceType: 'ai',
        }))
      );

      if (created) {
        setImportStatus(`AI optimized ${created.cardCount} cards into ${created.deckTitle}.`);
        setImportText('');
      }
    } catch (error: any) {
      setImportStatus(error?.message || 'AI optimize failed.');
    } finally {
      setIsOptimizingImport(false);
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
            <div className="arch-pill bg-black/5 dark:bg-white/ border-black/ dark:border-white/ text-black/ dark:text-white/ px-4 py-1.5 backdrop-blur-md">
              <LivePulse />
              <span className="text-[10px] uppercase font-black tracking-[0.2em]">Neural Active</span>
            </div>
          </div>
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-slate-900 dark:text-white leading-none tracking-tightest"
            >
              {greeting}
            </motion.h1>
            <p className="text-black/ dark:text-white/ text-sm font-medium tracking-wide">
              {stats.cardsDue > 0
                ? `You have ${stats.cardsDue} card${stats.cardsDue === 1 ? '' : 's'} due for review.`
                : 'Your knowledge baseline is stable. All decks processed.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black/ dark:text-white/ group-focus-within:text-black/ dark:text-white/ transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH NEURAL BASE..."
              className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ py-4 pl-14 pr-6 outline-none focus:border-black/ dark:border-white/ transition-all font-black text-[10px] tracking-[0.3em] uppercase text-slate-900 dark:text-white placeholder:text-black/ dark:text-white/ rounded-2xl backdrop-blur-xl"
            />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-14 h-14 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl flex items-center justify-center hover:bg-black/5 dark:bg-white/ transition-all group backdrop-blur-xl"
          >
            <Settings size={20} className="text-black/ dark:text-white/ group-hover:text-slate-900 dark:text-white group-hover:rotate-45 transition-all" />
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
            <div className="absolute inset-0 bg-black/5 dark:bg-white/ rounded-[32px] blur-sm translate-y-2 group-hover:translate-y-4 transition-transform opacity-0 group-hover:opacity-100" />
            <div className="relative bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ p-8 rounded-[32px] hover:bg-black/5 dark:bg-white/ transition-all duration-500 overflow-hidden backdrop-blur-xl group-hover:border-black/ dark:border-white/">
              <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 dark:bg-white/ -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-black/5 dark:bg-white/ transition-all" />
              <div className="flex items-center justify-between mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">{item.label}</p>
                <item.icon size={14} className="text-black/ dark:text-white/ group-hover:text-black/ dark:text-white/ transition-colors" />
              </div>
              <div className="space-y-1">
                <p className={`text-3xl sm:text-4xl lg:text-5xl font-display font-black italic leading-none ${item.color || 'text-slate-900 dark:text-white'}`}>
                  {item.value}
                </p>
                <p className="text-[9px] text-black/ dark:text-white/ uppercase font-black tracking-widest">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* PRIMARY INTERFACE: OPERATOR + PRIORITY */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        {/* AURA OPERATOR - 7 COLUMNS */}
        <motion.div data-testid="ai-generate-section" variants={fadeUp} className="xl:col-span-7 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[40px] p-8 sm:p-12 relative overflow-hidden group backdrop-blur-xl border-l border-t border-black/ dark:border-white/ shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-purple-600/10 transition-colors duration-1000" />
          
          <div className="relative z-10 space-y-12 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-xl flex items-center justify-center">
                  <Cpu size={20} className="text-black/ dark:text-white/" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">Command Center</p>
                  <p className="text-[9px] font-bold text-black/ dark:text-white/ uppercase tracking-[0.2em] mt-0.5 italic">Aura Mk.4</p>
                </div>
              </div>
              <div className="arch-pill bg-black/5 dark:bg-white/ border-black/ dark:border-white/ px-3 py-1">
                <LivePulse />
                <span className="text-[9px] font-black uppercase tracking-widest text-black/ dark:text-white/">Ready</span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl sm:text-6xl font-display font-black italic uppercase tracking-tightest leading-[0.85] text-slate-900 dark:text-white">
                GENERATE.<br />
                <span className="text-black/ dark:text-white/">ACCELERATE.</span>
              </h2>
              <p className="text-sm text-black/ dark:text-white/ max-w-lg font-medium leading-relaxed">
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
                  className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ px-8 py-5 outline-none focus:border-black/ dark:border-white/ group-hover/input:bg-black/5 dark:bg-white/ transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-black/ dark:text-white/ rounded-2xl"
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
        <motion.div variants={fadeUp} className="xl:col-span-5 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[40px] p-8 sm:p-10 relative overflow-hidden group backdrop-blur-xl group flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock3 size={16} className="text-black/ dark:text-white/" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">Priority Stream</p>
              </div>
              <div className="text-[10px] font-black uppercase text-black/ dark:text-white/">01 / {filteredDecks.length}</div>
            </div>

            {nextDeck ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="text-3xl lg:text-5xl font-display font-black italic uppercase tracking-tightest leading-none text-slate-900 dark:text-white transition-all group-hover:translate-x-2 duration-500">
                    {nextDeck.title}
                  </h3>
                  <p className="text-xs text-black/ dark:text-white/ italic line-clamp-2 leading-relaxed font-medium">
                    {nextDeck.description || "Experimental neural collection focused on core principles."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ p-6 rounded-3xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/ mb-2">Assets</p>
                    <p className="text-3xl font-display font-black italic text-slate-900 dark:text-white leading-none">{nextDeck.cardCount || 0}</p>
                  </div>
                  <div className="bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ p-6 rounded-3xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/ mb-2">Mastery</p>
                    <p className="text-3xl font-display font-black italic text-slate-900 dark:text-white leading-none">{nextDeck.mastery}%</p>
                    <div className="mt-3">
                      <MiniBar value={nextDeck.mastery} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl flex items-center justify-center">
                  <ZapOff size={24} className="text-black/ dark:text-white/" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/ dark:text-white/">No Signals Detected</p>
                  <p className="text-[9px] text-black/ dark:text-white/ uppercase tracking-widest italic">Create a collection to start.</p>
                </div>
              </div>
            )}
          </div>

          {nextDeck && (
            <button
              onClick={() => onSelectDeck(nextDeck.id)}
              className="w-full mt-10 py-5 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl flex items-center justify-center gap-3 text-black/ dark:text-white/ hover:bg-white hover:text-black hover:border-white transition-all duration-500 font-black uppercase text-[10px] tracking-[0.3em] group/btn"
            >
              <Zap size={14} className="group-hover/btn:fill-current" />
              Initialize Session
              <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </button>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        <motion.div variants={fadeUp} className="xl:col-span-4 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">Aha Moment</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-slate-900 dark:text-white mt-2">Start in 30 seconds</h3>
            </div>
            <Rocket size={18} className="text-black/ dark:text-white/" />
          </div>
          <p className="text-sm text-black/ dark:text-white/ leading-relaxed">
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
              className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ text-slate-900 dark:text-white rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Start 30s Tour
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-4 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">One-Click Import</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-slate-900 dark:text-white mt-2">Anki / Notion / Obsidian</h3>
            </div>
            <Upload size={18} className="text-black/ dark:text-white/" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['anki_quizlet', 'Anki/Quizlet text'],
              ['notion', 'Notion page'],
              ['obsidian', 'Obsidian markdown'],
              ['anki_apkg', 'Anki .apkg'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setImportMode(id as 'anki_quizlet' | 'notion' | 'obsidian' | 'anki_apkg')}
                className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] ${
                  importMode === id ? 'border-black/ dark:border-white/ bg-black/5 dark:bg-white/ text-slate-900 dark:text-white' : 'border-black/ dark:border-white/ bg-black/5 dark:bg-white/ text-black/ dark:text-white/'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingImportFile(true);
            }}
            onDragLeave={() => setIsDraggingImportFile(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingImportFile(false);
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) handleStudyAssetUpload(droppedFile);
            }}
            className={`rounded-2xl border-2 border-dashed px-5 py-4 text-xs transition-all ${
              isDraggingImportFile
                ? 'border-black/ dark:border-white/ bg-black/5 dark:bg-white/ text-slate-900 dark:text-white'
                : 'border-black/ dark:border-white/ bg-black/5 dark:bg-white/ text-black/ dark:text-white/'
            }`}
          >
            <p className="font-black uppercase tracking-[0.2em]">Drop PDF / PPTX here</p>
            <p className="mt-2 text-black/ dark:text-white/">Auto-generate cards with equation text preserved.</p>
          </div>
          <input
            type="text"
            value={importTitle}
            onChange={(event) => setImportTitle(event.target.value)}
            placeholder="Deck title"
            className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white placeholder:text-black/ dark:text-white/"
          />
          <input
            type="file"
            accept={importMode === 'anki_apkg' ? '.apkg' : '.md,.markdown,.txt,.pdf,.pptx,.ppt'}
            onChange={handleImportFile}
            className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl px-5 py-3 text-xs text-black/ dark:text-white/ file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 dark:bg-white/ file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 dark:text-white"
          />
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.pptx,.ppt';
              input.onchange = () => {
                const selected = input.files?.[0];
                if (selected) handleStudyAssetUpload(selected);
              };
              input.click();
            }}
            disabled={isProcessingStudyAsset}
            className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ text-slate-900 dark:text-white rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            {isProcessingStudyAsset ? 'Processing Upload...' : 'Upload PDF / PowerPoint'}
          </button>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={
              importMode === 'notion'
                ? 'Paste Notion page Markdown or copied page text'
                : importMode === 'obsidian'
                  ? 'Paste Obsidian Markdown'
                  : importMode === 'anki_apkg'
                    ? 'Upload .apkg above for one-click import, or paste `front::back` as fallback'
                    : 'Paste `term<TAB>definition`, `front::back`, or Q:/A: blocks'
            }
            className="w-full min-h-[170px] bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white placeholder:text-black/ dark:text-white/"
          />
          <button
            onClick={handleImport}
            className="w-full bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ text-slate-900 dark:text-white rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Import Deck
          </button>
          <button
            onClick={handleAiOptimizeImport}
            disabled={isOptimizingImport}
            className="w-full bg-transparent border border-black/ dark:border-white/ text-black/ dark:text-white/ rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            {isOptimizingImport ? 'Optimizing...' : 'AI Optimize This Deck'}
          </button>
          {importStatus && <p className="text-xs text-black/ dark:text-white/">{importStatus}</p>}
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-4 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[36px] p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">Retention Battery</p>
              <h3 className="text-2xl font-display font-black italic uppercase text-slate-900 dark:text-white mt-2">Momentum Layer</h3>
            </div>
            <Flame size={18} className="text-amber-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-black/ dark:border-white/ bg-black/5 dark:bg-white/ p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-black/ dark:text-white/">Streak</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{user.streak || 0}d</p>
            </div>
            <div className="rounded-2xl border border-black/ dark:border-white/ bg-black/5 dark:bg-white/ p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-black/ dark:text-white/">XP Today</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{xpToday}</p>
            </div>
            <div className="rounded-2xl border border-black/ dark:border-white/ bg-black/5 dark:bg-white/ p-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-black/ dark:text-white/">Badges</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{achievementCount}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10 p-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-200">Streak Freeze Bank</p>
            <p className="mt-2 text-sm text-slate-800 dark:text-white/80">
              {streakFreezes} freeze{streakFreezes === 1 ? '' : 's'} earned
              {' '}({daysToNextFreeze} days to next).
            </p>
          </div>
          
          <div className="rounded-2xl border border-black/ dark:border-white/ bg-black/5 dark:bg-white/ p-5">
            <ActivityHeatmap streak={user.streak || 0} studiedToday={stats.studiedToday} />
          </div>

          <div className="rounded-2xl border border-black/ dark:border-white/ bg-black/5 dark:bg-white/ p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/ dark:text-white/">Beta Challenge</p>
              <span className="text-[10px] text-black/ dark:text-white/">{challengeProgress.completedDays}/{challengeProgress.targetDays}</span>
            </div>
            <p className="text-sm text-black/ dark:text-white/ mt-3 leading-relaxed">
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
                className="flex-1 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ text-slate-900 dark:text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
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
              <Layers size={16} className="text-black/ dark:text-white/" />
              <p className="text-arch-eyebrow uppercase">Neural Library</p>
            </div>
            <button 
              onClick={() => navigate('/generate')}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-black/ dark:text-white/ hover:text-slate-900 dark:text-white transition-colors flex items-center gap-2 group"
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
                className="group relative bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ p-7 rounded-[32px] text-left hover:bg-black/5 dark:bg-white/ transition-all hover:border-black/ dark:border-white/ overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 dark:bg-white/ -mr-8 -mt-8 rounded-full blur-xl group-hover:bg-black/5 dark:bg-white/ transition-all" />
                <div className="flex flex-col justify-between h-full min-h-[160px] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="arch-pill bg-black/5 dark:bg-white/ text-black/ dark:text-white/ border-black/ dark:border-white/ py-1 px-3">
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {deck.due > 0 ? `${deck.due} SIGNAL` : 'STABLE'}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-black/ dark:text-white/ group-hover:text-slate-900 dark:text-white transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-display font-black italic uppercase tracking-tight text-slate-900 dark:text-white line-clamp-1">{deck.title}</h3>
                      <p className="text-[11px] text-black/ dark:text-white/ font-medium leading-relaxed line-clamp-2 italic">{deck.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-black/ dark:text-white/">
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
              className="bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ border-dashed rounded-[32px] p-7 flex flex-col items-center justify-center min-h-[200px] group hover:bg-black/5 dark:bg-white/ hover:border-black/ dark:border-white/ transition-all gap-4"
            >
              <div className="w-12 h-12 bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/ dark:text-white/">Incept New</p>
                <p className="text-[8px] text-black/ dark:text-white/ uppercase tracking-widest mt-1">Manual or AI-driven</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* SIDEBAR TOOLS - 4 COLUMNS */}
        <div className="xl:col-span-4 space-y-8">
          {/* LEADERBOARD */}
          <motion.div data-testid="leaderboard-section" variants={fadeUp} className="bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[40px] overflow-hidden backdrop-blur-xl border-l border-t border-black/ dark:border-white/ p-2">
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-3">
                <Trophy size={16} className="text-black/ dark:text-white/" />
                <p className="text-arch-eyebrow uppercase">Neural Ranking</p>
              </div>
              <Activity size={14} className="text-black/ dark:text-white/" />
            </div>
            
            <div className="space-y-1 mt-4">
              {leaderboard.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => onSelectDeck(entry.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-black/5 dark:bg-white/ transition-all group rounded-3xl"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black italic w-5 ${i === 0 ? 'text-slate-900 dark:text-white' : 'text-black/ dark:text-white/'}`}>
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/ dark:text-white/ group-hover:text-slate-900 dark:text-white transition-colors">
                        {entry.title}
                      </p>
                      <p className="text-[8px] text-black/ dark:text-white/ uppercase font-bold tracking-widest mt-0.5 whitespace-nowrap">
                        {entry.cardCount} units · {entry.mastery}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-black italic text-slate-900 dark:text-white">{entry.score}</p>
                    <p className="text-[7px] text-black/ dark:text-white/ font-bold uppercase tracking-widest">PTS</p>
                  </div>
                </button>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-[10px] text-black/ dark:text-white/ font-black uppercase tracking-[0.4em] italic">Aura Offline.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* QUICK ACCESS */}
          <motion.div variants={fadeUp} className="bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ rounded-[40px] p-2 overflow-hidden backdrop-blur-xl border-l border-t border-black/ dark:border-white/">
            <div className="p-6 pb-2 flex items-center gap-3">
              <Sparkles size={16} className="text-black/ dark:text-white/" />
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
                  className="w-full flex items-center gap-5 px-6 py-5 hover:bg-white text-black/ dark:text-white/ hover:text-black transition-all duration-500 group rounded-3xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/ border border-black/ dark:border-white/ flex items-center justify-center group-hover:bg-black/5 group-hover:border-black/10 transition-all shrink-0">
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
