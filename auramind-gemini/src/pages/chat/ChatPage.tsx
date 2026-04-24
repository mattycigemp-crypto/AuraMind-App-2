import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, BrainCircuit, FileText, Target, ShieldCheck, Link2, FileUp, WandSparkles, Loader2, Radar, Trash2, Crown, Command, Check, AlertTriangle, Mail, CreditCard, Lock, LayoutGrid, CalendarDays, ArrowRight, ChevronRight, Globe, Search, Bell, Mic2, Settings, Activity, Sparkles, Terminal, User, Users, Eye, EyeOff, Copy, Download, Share2, Volume2, GraduationCap, Quote } from 'lucide-react';
import { Deck, Card, UserProfile } from '../../types';
import { GeneratedCard } from '../../services/api/deepseekService';
import { PageHeader } from '../../components/shared/PageComponents';
import MathRichText from '../../components/shared/MathRichText';
// TODO: AuraAgent types and functions need to be implemented
// import { AuraAgentMode, AuraAgentOutputType, AuraAgentResult, runAuraAgent } from '../../services/api/deepseekService';

type AuraAgentMode = 'study_from_anything' | 'study_buddy' | 'content_pipeline' | 'research_assistant';
type AuraAgentOutputType = 'all' | 'flashcards' | 'quiz' | 'summary';
interface AuraAgentResult {
  flashcards?: GeneratedCard[];
  quiz?: any;
  summary?: string;
  researchPack?: any;
  studyBuddy?: any;
  metadata?: any;
}

const runAuraAgent = async (params: any): Promise<AuraAgentResult> => {
  // Placeholder implementation
  return { flashcards: [], quiz: null, summary: '', metadata: null };
};

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
