import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
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
  MessageSquareText,
  Mic2,
  Radar,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  WandSparkles,
  Zap
} from 'lucide-react';
import { Deck, Card, Rating, UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { GeneratedCard, generateFlashcards } from '../services/geminiService';
import { AuraAgentMode, AuraAgentOutputType, AuraAgentResult, runAuraAgent } from '../services/agentService';
import { useTheme } from '../hooks/useTheme';

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
        <div className="w-full bg-black dark:bg-white relative overflow-hidden" style={{ height: `${Math.max(12, value)}%` }}>
           <div className="absolute inset-0 bg-white/10 dark:bg-black/10 animate-pulse" />
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

// --- INSIGHTS PAGE ---
export const DashboardInsightsPage = ({ decks, cards }: { decks: Deck[], cards: Card[] }) => {
  const dueCards = cards.filter((c) => c.nextReview <= Date.now()).length;
  const masteredCards = cards.filter((c) => (c.interval || 0) >= 14 && (c.repetition || 0) >= 3).length;
  const retention = cards.length === 0 ? 0 : Math.round((masteredCards / cards.length) * 100);
  const topDecks = useMemo(
    () => [...getDeckAnalytics(decks, cards)].sort((a, b) => (b.cardCount || 0) - (a.cardCount || 0)).slice(0, 5),
    [cards, decks]
  );
  const weekly = [54, 67, 72, 64, 79, 86, 91];

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="STUDY INSIGHTS." subtitle="Retention, deck quality, and how your learning system is actually behaving." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile label="Retention Rate" value={`${retention}%`} detail="Mastered cards across the full study library." />
        <MetricTile label="Cards Due" value={dueCards} detail="Immediate backlog that can move your streak or sink it." accent="text-amber-300" />
        <MetricTile label="Mastered Cards" value={masteredCards} detail="Cards that are now surviving wider spacing intervals." accent="text-emerald-300" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
        <div className="architectural-panel p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-arch-eyebrow mb-3">Learning velocity</p>
              <h2 className="text-3xl font-black italic">WEEK OVER WEEK.</h2>
            </div>
            <TrendingUp size={20} className="text-arch-fg" />
          </div>
          <BarSeries values={weekly} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
        </div>

        <div className="architectural-panel p-8">
          <p className="text-arch-eyebrow mb-8">Deck Breakdown</p>
          <div className="space-y-4">
            {topDecks.map((deck) => (
              <div key={deck.id} className="border border-arch-border bg-arch-fg/5 p-6 hover:bg-arch-fg/10 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black uppercase tracking-widest text-[12px] text-arch-fg">{deck.title}</span>
                  <span className="text-arch-fg font-black text-[10px] uppercase tracking-widest">{deck.cardCount} cards</span>
                </div>
                <div className="mt-6 flex items-center justify-between text-[8px] uppercase tracking-[0.4em] text-arch-muted italic">
                  <span>{deck.due} due</span>
                  <span>{deck.mastery}% mastered</span>
                  <span>{deck.reviews} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PLANNER PAGE ---
export const DashboardPlannerPage = ({ decks, cards, navigate }: { decks: Deck[], cards: Card[], navigate: any }) => {
  const upcoming = [...cards]
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, 10);
  const dueDecks = getDeckAnalytics(decks, cards).filter((deck) => deck.due > 0).sort((a, b) => b.due - a.due);

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="STUDY PLAN." subtitle="The fastest path to momentum over the next session window." />

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="architectural-panel p-8">
          <p className="text-arch-eyebrow mb-6">Upcoming tasks</p>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-arch-muted italic text-[10px] uppercase tracking-widest">Nothing is scheduled right now.</p>}
            {upcoming.map((card) => (
              <div key={card.id} className="p-6 border border-arch-border bg-arch-fg/5">
                <p className="text-xs font-bold leading-relaxed text-arch-fg">{card.question}</p>
                <p className="text-[9px] text-arch-muted mt-4 font-black uppercase tracking-[0.4em]">Review: {new Date(card.nextReview).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-6">Priority Decks</p>
            <div className="space-y-3">
              {dueDecks.length === 0 && <p className="text-arch-muted italic text-[10px] uppercase tracking-widest">Full library is optimized.</p>}
              {dueDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="w-full border border-arch-border bg-arch-fg/5 p-6 text-left hover:border-arch-fg transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black uppercase tracking-widest text-[12px] text-arch-fg">{deck.title}</span>
                    <span className="text-arch-fg text-[10px] font-black uppercase tracking-[0.2em]">{deck.due} due</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8 space-y-6">
            <p className="text-arch-eyebrow">Quick Actions</p>
            <button onClick={() => navigate('/dashboard')} className="btn-arch w-full">Open Operator</button>
            <button onClick={() => navigate('/generate')} className="btn-arch-outline w-full py-4 text-[10px] font-black uppercase tracking-[0.4em]">Generate Deck</button>
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
              <h3 className="text-lg font-black italic tracking-tight mb-8 text-arch-fg">{card.question}</h3>
            </div>
            <div className="pt-6 border-t border-arch-border">
              <p className="text-arch-eyebrow mb-3">Answer</p>
              <p className="text-xs text-arch-muted italic line-clamp-3 font-medium">{card.answer}</p>
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
}: {
  navigate: (path: string) => void;
  createGeneratedDeck: (topic: string) => Promise<{ deckTitle: string; cardCount: number } | null>;
  createDeckFromCards: (title: string, description: string, generatedCards: GeneratedCard[]) => Promise<{ deckId: string; deckTitle: string; cardCount: number } | null>;
  user: UserProfile;
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

      setResult(await runAuraAgent({
        mode,
        prompt,
        sourceText,
        sourceUrl,
        outputType,
        difficulty,
        file,
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
                className={`border p-6 text-left transition-all ${mode === value ? 'border-arch-fg bg-arch-fg/5' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{label}</p>
                <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">{detail}</p>
              </button>
            ))}
          </div>

          <div className="border border-arch-border bg-arch-fg/5 p-10 space-y-8">
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

            <div className="border border-arch-border bg-arch-fg/5 p-8 min-h-[400px]">
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
                        <div key={`${card.question}-${index}`} className="border border-arch-border bg-arch-bg p-6 group hover:bg-arch-fg/5 transition-all">
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted italic mb-3">Flashcard {(index + 1).toString().padStart(2, '0')}</p>
                          <p className="text-xs font-black italic tracking-tight text-arch-fg">{card.question}</p>
                          <p className="text-[10px] text-arch-muted font-medium mt-4 uppercase tracking-widest">{card.answer}</p>
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
                <div key={title} className="border border-arch-border bg-arch-fg/5 p-6">
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
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-colors"
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
                        {deleteReasons.includes(reason) && <Check size={12} className="text-white" />}
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
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
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
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-50 transition-colors"
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
  const [panel, setPanel] = useState<'users' | 'analytics' | 'settings'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionError, setActionError] = useState('');
  
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

  useEffect(() => {
    if (user.isAdmin && panel === 'users') {
      fetchUsers();
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
            <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic mt-4">
              * Note: To view and edit all users, ensure you have set SUPABASE_SERVICE_ROLE_KEY in your Vercel Environment Variables.
            </p>
          </div>
        )}

        {panel !== 'users' && (
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
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (!error) navigate('/auth');
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
                  <p className="text-sm font-black italic tracking-tight text-arch-fg">{card.question}</p>
                </div>
                <div>
                  <p className="text-arch-eyebrow mb-3">Answer</p>
                  <p className="text-xs text-arch-muted font-medium italic whitespace-pre-wrap">{card.answer}</p>
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

  useEffect(() => {
    if (deckId) setActiveDeckId(deckId);
  }, [deckId, setActiveDeckId]);

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

  const activeCard = dueCards[currentIndex];

  const handleRating = async (rating: Rating) => {
    await rateCard(activeCard.id, rating);
    setShowAnswer(false);
    setCurrentIndex((prev) => Math.min(prev + 1, dueCards.length - 1));
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader
        title="STUDY MODE."
        subtitle={`${deck.title} • ${currentIndex + 1} of ${dueCards.length} queued`}
        action={
          <button onClick={() => navigate(`/deck/${deckId}`)} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Deck
          </button>
        }
      />

      <div className="architectural-panel p-10 space-y-10">
        <div className="h-1 bg-arch-fg/10">
          <motion.div className="h-full bg-arch-fg" animate={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }} />
        </div>

        <div className="border border-arch-border bg-arch-fg/5 p-12 min-h-[480px] flex flex-col justify-between">
          <div>
            <p className="text-arch-eyebrow mb-10">{showAnswer ? 'Response sequence' : 'Inquiry protocol'}</p>
            <h2 className="text-4xl font-black leading-tight italic tracking-tighter text-arch-fg">{showAnswer ? activeCard.answer : activeCard.question}</h2>
          </div>

          {!showAnswer ? (
            <button onClick={() => setShowAnswer(true)} className="btn-arch self-start min-w-[200px]">
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
                  className={`border border-arch-border bg-arch-bg px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${option.tone}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
