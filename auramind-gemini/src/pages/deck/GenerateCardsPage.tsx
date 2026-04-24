import React, { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Deck, Card } from '../../types';
import { GeneratedCard } from '../../services/api/deepseekService';
import MathRichText from '../../components/shared/MathRichText';
import { generateFlashcards } from '../../services/api/deepseekService';

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
