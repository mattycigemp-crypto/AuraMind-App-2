import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMnemonic, MnemonicResult } from '../../services/ai/mnemonicService';
import { SparklesIcon as Sparkles, Wand2Icon as Wand2, CopyIcon as Copy, CheckIcon as Check, XIcon as X, BrainIcon as Brain, HomeIcon as Home, BookOpenIcon as BookOpen, LightbulbIcon as Lightbulb } from '../icons/CustomIcons';
import {
  StaggerList,
  useScrollReveal,
} from '../../lib/effects';

interface MnemonicGeneratorProps {
  initialTopic?: string;
  onClose?: () => void;
  className?: string;
}

export const MnemonicGenerator: React.FC<MnemonicGeneratorProps> = ({ initialTopic = '', onClose, className = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [result, setResult] = useState<MnemonicResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'acronyms' | 'mnemonics' | 'palace' | 'story'>('acronyms');

  // anime.js v4 ScrollObserver on the results region so the tabs slide in
  // once when the panel becomes visible. Lazy users (no scroll) still see
  // the static panel.
  const resultsReveal = useScrollReveal<HTMLDivElement>({
    enter: { duration: 500, opacity: [0, 1], translateY: [12, 0] },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateMnemonic(topic.trim());
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate memory aids');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'acronyms', label: 'Acronyms', icon: BookOpen },
    { id: 'mnemonics', label: 'Mnemonics', icon: Lightbulb },
    { id: 'palace', label: 'Memory Palace', icon: Home },
    { id: 'story', label: 'Story', icon: Brain },
  ] as const;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 ${className}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Memory Wizard</h2>
              <p className="text-xs text-zinc-400">AI-generated mnemonics, acronyms & memory palaces</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Enter a topic, list, or concept..."
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wand2 size={18} />
              )}
              Generate
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        {/* Results — anime.js v4 ScrollObserver fades the panel in once
            it scrolls into view; fallthrough to static display if disabled. */}
        <div ref={resultsReveal.ref} className="flex-1 overflow-y-auto p-6" style={{ willChange: 'opacity, transform' }}>
          {!result && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Brain size={28} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">Enter a topic to generate memory aids</p>
              <p className="text-zinc-600 text-xs mt-1">Try: "Order of planets", "Biology cell parts", "Trigonometry SOH CAH TOA"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mb-4" />
              <p className="text-zinc-500 text-sm">Crafting memory aids...</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Tabs — StaggerList replaces the flex row so each tab fades in
                  50ms apart. Active-tab styling (zinc-800 bg) is preserved;
                  StaggerList only adds the entrance + data-stagger-item marker. */}
              <StaggerList
                delayMs={50}
                durationMs={320}
                from="down"
                distance={8}
                className="flex gap-1 mb-4 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </StaggerList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {activeTab === 'acronyms' && (
                    <div className="space-y-3">
                      {result.acronyms.length > 0 ? result.acronyms.map((acronym, i) => (
                        <div key={i} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                          <p className="text-sm text-zinc-200">{acronym}</p>
                        </div>
                      )) : <p className="text-zinc-500 text-sm">No acronyms generated.</p>}
                    </div>
                  )}

                  {activeTab === 'mnemonics' && (
                    <div className="space-y-3">
                      {result.mnemonics.length > 0 ? result.mnemonics.map((mnemonic, i) => (
                        <div key={i} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                          <p className="text-sm text-zinc-200">{mnemonic}</p>
                        </div>
                      )) : <p className="text-zinc-500 text-sm">No mnemonics generated.</p>}
                    </div>
                  )}

                  {activeTab === 'palace' && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-sm text-zinc-200 leading-relaxed">{result.memoryPalace || 'No memory palace generated.'}</p>
                    </div>
                  )}

                  {activeTab === 'story' && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-sm text-zinc-200 leading-relaxed">{result.story || result.visualCue || 'No story generated.'}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Copy all */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MnemonicGenerator;
