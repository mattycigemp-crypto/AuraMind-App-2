import React, { useState, useMemo } from 'react';
import { ChevronLeft, Radar, Link2, FileUp, WandSparkles, Trash2, Download, Copy, LayoutGrid, Check, Plus, MessageSquareText } from 'lucide-react';
import { UserProfile, Deck, Card } from '../../types';
import { GeneratedCard } from '../../services/api/deepseekService';
import MathRichText from '../../components/shared/MathRichText';
import PageHeader from '../../components/shared/PageHeader';
// TODO: AuraAgent types and functions need to be implemented
// import { AuraAgentMode, AuraAgentOutputType, AuraAgentResult, runAuraAgent } from '../../services/agentService';

type AuraAgentMode = 'study_from_anything' | 'study_buddy' | 'content_pipeline' | 'research_assistant';
type AuraAgentOutputType = 'all' | 'flashcards' | 'quiz' | 'summary';
interface AuraAgentResult {
  flashcards?: GeneratedCard[];
  quiz?: any;
  summary?: string;
}

// TODO: Implement runAuraAgent function
const runAuraAgent = async (params: any): Promise<AuraAgentResult> => {
  console.warn('runAuraAgent not implemented yet', params);
  return {};
};

interface AuraOperatorPageProps {
  navigate: (path: string) => void;
  createGeneratedDeck: (topic: string) => Promise<{ deckTitle: string; cardCount: number } | null>;
  createDeckFromCards: (title: string, description: string, generatedCards: GeneratedCard[]) => Promise<{ deckId: string; deckTitle: string; cardCount: number } | null>;
  user: UserProfile;
  decks?: Deck[];
  cards?: Card[];
}

const AuraOperatorPage: React.FC<AuraOperatorPageProps> = ({
  navigate,
  createGeneratedDeck,
  createDeckFromCards,
  user,
  decks = [],
  cards = [],
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
        mode === 'research_assistant' ? 'Researching...' : 'Processing...'
      );

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
        userContext += `\nPerformance: ${deckMastery.join(', ')}.`;
      }

      const res = await runAuraAgent({
        mode,
        prompt,
        sourceText,
        sourceUrl,
        outputType,
        difficulty,
        file,
        userContext,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Run failed.');
    } finally {
      setStatus('Ready');
      setIsRunning(false);
    }
  };

  const clearWorkspace = () => {
    setPrompt(''); setSourceText(''); setSourceUrl(''); setFile(null);
    setResult(null); setError(''); setSaveStatus(''); setOutputType('all'); setDifficulty('medium');
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
    anchor.href = url; anchor.download = `auramind-${mode}.json`; anchor.click();
    URL.revokeObjectURL(url);
    setSaveStatus('Export JSON downloaded.');
  };

  const saveAsDeck = async () => {
    if (!availableFlashcards.length) return;
    setSaveStatus('Saving...');
    try {
      const deckTitle = prompt.trim() || result?.title || 'AuraMind Agent Deck';
      const description = availableSummary || `Generated from ${mode} mode.`;
      const created = await createDeckFromCards(deckTitle, description, availableFlashcards);
      setSaveStatus(created ? `Saved "${created.deckTitle}"` : 'Save failed.');
    } catch (saveError: any) {
      setSaveStatus(saveError?.message || 'Save failed.');
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader
        title="AURA OPERATOR."
        subtitle="A four-mode in-app agent for study generation, tutoring, and research."
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
              ['study_from_anything', 'Study From Anything', 'Turn text into study assets.'],
              ['study_buddy', 'Study Buddy', 'Socratic tutor and guide.'],
              ['content_pipeline', 'Content Pipeline', 'Process material into exports.'],
              ['research_assistant', 'Research Assistant', 'Research topic and study packs.'],
            ].map(([value, label, detail]) => (
              <button key={value} onClick={() => setMode(value as AuraAgentMode)} className={`border p-6 text-left transition-all ${mode === value ? 'border-arch-fg bg-arch-muted/10' : 'border-arch-border bg-transparent hover:bg-arch-muted/5'}`}>
                <p className="text-[10px] font-black uppercase text-arch-fg">{label}</p>
                <p className="text-[8px] text-arch-muted italic mt-3 uppercase">{detail}</p>
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
                <Radar size={12} /> {status}
              </div>
            </div>

            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Name the goal or topic" className="w-full bg-arch-bg border border-arch-border px-6 py-5 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg" />
            <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Paste source material here..." className="w-full min-h-[300px] resize-none bg-arch-bg border border-arch-border p-8 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg" />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-arch-border bg-arch-bg p-6">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4"><Link2 size={14} className="text-arch-fg" /> Source URL</div>
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="w-full bg-transparent text-xs font-medium outline-none text-arch-fg" />
              </div>
              <label className="border border-arch-border bg-arch-bg p-6 cursor-pointer hover:bg-arch-fg/5 transition-all">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4"><FileUp size={14} className="text-arch-fg" /> Uploaded file</div>
                <p className="text-[10px] font-black uppercase text-arch-fg">{file ? file.name : 'Upload Source Media'}</p>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>

            {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{error}</p>}

            <div className="flex flex-wrap gap-4 pt-4 border-t border-arch-border">
              <button onClick={runAgent} disabled={isRunning} className="btn-arch min-w-[180px]">{isRunning ? 'Processing...' : 'Run Operator'}</button>
              <button onClick={clearWorkspace} className="btn-arch-outline min-w-[180px]">Clear Session</button>
            </div>
          </div>
        </div>

        <div className="architectural-panel p-8 space-y-8">
           <div className="flex items-center justify-between gap-4 border-b border-arch-border pb-6">
            <div>
              <p className="text-arch-eyebrow">Aura Result Output</p>
              <h2 className="text-2xl font-black italic lowercase uppercase">{result ? result.title || 'Run Result' : 'Operator Log'}</h2>
            </div>
            {result && (
              <div className="flex gap-2">
                <button onClick={copyExportJson} title="Copy JSON" className="p-3 border border-arch-border text-arch-muted hover:text-arch-fg"><Copy size={16} /></button>
                <button onClick={downloadExportJson} title="Download JSON" className="p-3 border border-arch-border text-arch-muted hover:text-arch-fg"><Download size={16} /></button>
              </div>
            )}
          </div>

          <div className="space-y-8 max-h-[800px] overflow-y-auto pr-4 scrollbar-hide">
            {!result && !isRunning && (
              <div className="border border-arch-border bg-arch-fg/5 p-12 text-arch-muted text-[10px] uppercase tracking-[0.4em] italic text-center">
                System idle. Launch a run to generate study assets.
              </div>
            )}

            {result?.studyBuddy && (
              <div className="space-y-8">
                <div className="border border-arch-border bg-arch-fg/[0.03] p-8">
                  <p className="text-arch-eyebrow mb-4">Tutor Insights</p>
                  <p className="text-sm font-medium italic text-arch-fg leading-relaxed">
                    <MathRichText text={result.studyBuddy.response} block />
                  </p>
                </div>
                {result.studyBuddy.followUpQuestions?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase text-arch-muted tracking-[0.4em]">Guided Queries</p>
                    {result.studyBuddy.followUpQuestions.map((q, i) => (
                      <div key={i} className="border border-arch-border p-5 text-xs font-black italic text-arch-fg">{q}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {availableSummary && (
              <div className="border border-arch-border bg-arch-fg/[0.03] p-8">
                <p className="text-arch-eyebrow mb-4">Conceptual Summary</p>
                <p className="text-sm font-medium italic text-arch-fg leading-relaxed uppercase whitespace-pre-wrap">{availableSummary}</p>
              </div>
            )}

            {availableFlashcards.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-arch-eyebrow">Flashcard Protocol ({availableFlashcards.length})</p>
                  <button onClick={saveAsDeck} className="inline-flex items-center gap-2 border border-arch-border px-3 py-2 text-[10px] font-black uppercase text-arch-fg hover:bg-arch-fg/5"><Plus size={14} /> Save to Library</button>
                </div>
                {saveStatus && <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">{saveStatus}</p>}
                <div className="grid gap-4">
                  {availableFlashcards.map((card, idx) => (
                    <div key={idx} className="border border-arch-border p-6 bg-arch-fg/[0.02]">
                       <p className="text-[8px] font-black uppercase text-arch-muted mb-2 tracking-widest">Item {idx+1}</p>
                       <p className="text-sm font-black italic text-arch-fg mb-3"><MathRichText text={card.question} block /></p>
                       <p className="text-xs text-arch-muted italic"><MathRichText text={card.answer} block /></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraOperatorPage;
