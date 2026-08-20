/**
 * MemoryPalaceBuilder — Interactive Method-of-Loci walkthrough.
 *
 * Lets learners enter a list of items to memorize, then guides them
 * station-by-station through a vivid "palace" placing each item at
 * a memorable spot. Classical mnemonic technique used by memory
 * athletes to memorize 100+ items in minutes.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shuffle,
  Play,
} from '@/components/icons';
import {
  buildMemoryPalace,
  effectiveMaxItems,
  type MemoryPalace,
} from '../../services/study/memoryPalaceService';
import { chipCopyForProfile } from '../../services/study/fsrsAdaptation';

interface MemoryPalaceBuilderProps {
  initialItems?: string[];
  /**
   * When set, the per-walk capacity comes from the user's learned profile
   * (e.g. fast-learners carry more stations; tough-learners carry fewer).
   * When undefined, the conservative default (12) applies.
   */
  profileLabel?: string | null;
  onClose?: () => void;
}

export const MemoryPalaceBuilder: React.FC<MemoryPalaceBuilderProps> = ({
  initialItems = [],
  profileLabel = null,
  onClose,
}) => {
  const [itemsText, setItemsText] = useState(initialItems.join('\n'));
  const [settingHint, setSettingHint] = useState('');
  const [palace, setPalace] = useState<MemoryPalace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStation, setCurrentStation] = useState(0);
  const [revealedStations, setRevealedStations] = useState<Set<number>>(new Set());

  const items = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
  // Profile-derived capacity. Falls back to the conservative default
  // (12) when the user hasn't passed a tuned profileLabel.
  const capacity = effectiveMaxItems(profileLabel);
  const chip = chipCopyForProfile(profileLabel);
  const capacityHint = chip
    ? `Tuned for ${chip.label.toLowerCase()} · up to ${capacity} items`
    : `Up to ${capacity} items per walk`;

  useEffect(() => {
    if (initialItems.length && !palace) {
      // Build once on first mount if caller pre-supplied items.
      const seed = initialItems.map(s => s.trim()).filter(Boolean);
      if (seed.length === 0) return;
      setLoading(true);
      buildMemoryPalace(seed, undefined, profileLabel).then(p => {
        setPalace(p);
        setCurrentStation(0);
        setRevealedStations(new Set());
      }).catch(e => setError(e?.message ?? 'Failed')).finally(() => setLoading(false));
    }
    // Intentionally run once on first mount when initialItems were supplied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await buildMemoryPalace(items, settingHint || undefined, profileLabel);
      setPalace(res);
      setCurrentStation(0);
      setRevealedStations(new Set());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to build palace');
    } finally {
      setLoading(false);
    }
  };

  const revealThis = (idx: number) => {
    setRevealedStations(prev => {
      const s = new Set(prev);
      s.add(idx);
      return s;
    });
  };

  const revealAll = () => {
    setRevealedStations(new Set(palace?.stations.map((_, i) => i) ?? []));
  };

  const reset = () => {
    setPalace(null);
    setRevealedStations(new Set());
    setCurrentStation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-[#0A0A0F]">
      {/* Backdrop closes when clicked */}
      {onClose && <div className="absolute inset-0" onClick={onClose} />}

      <div className="relative w-full max-w-4xl mx-auto my-8 flex flex-col bg-gradient-to-b from-[#111118] to-[#0A0A0F] border border-[#2A2A3A] rounded-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A3A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F0EFFE]">Memory Palace</h2>
              <p className="text-[10px] text-[#7A7A96]">Method of Loci · A competitive mnemonist's secret</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111118] border border-[#2A2A3A] text-[#7A7A96] hover:text-[#F0EFFE]"
            >
              <X size={16} />
            </button>
          )}
        </header>

        {!palace ? (
          // INPUT MODE
          <div className="p-6 space-y-4 flex-1 flex flex-col">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#9090A8] font-bold">
                Items to memorize (one per line)
              </label>
              <textarea
                value={itemsText}
                onChange={e => setItemsText(e.target.value)}
                rows={8}
                placeholder={'Pomodoro timer\nActive Recall\nSpaced Repetition\nSleep\n...'}
                className="w-full mt-2 p-3 text-sm bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg text-[#F0EFFE] placeholder-[#3A3A4F] focus:outline-none focus:border-[#7C3AED]/40 resize-none font-mono"
              />
              <div className="text-[10px] text-[#7A7A96] mt-1">
                {items.length} / {capacity} items · {capacityHint}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#9090A8] font-bold">
                Walking setting (optional)
              </label>
              <input
                type="text"
                value={settingHint}
                onChange={e => setSettingHint(e.target.value)}
                placeholder="e.g. Your childhood home, walked front-to-back"
                className="w-full mt-2 p-3 text-sm bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg text-[#F0EFFE] placeholder-[#3A3A4F] focus:outline-none focus:border-[#7C3AED]/40"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#2A2A3A]">
              <button
                onClick={() => {
                  const demo = ['Pomodoro Timer', 'Active Recall', 'Spaced Repetition', 'Sleep', 'Curiosity', 'Mnemonics'];
                  setItemsText(demo.join('\n'));
                }}
                className="flex items-center gap-1 text-[10px] text-[#7A7A96] hover:text-[#8B5CF6] uppercase tracking-widest font-bold"
              >
                <Shuffle size={10} /> Example
              </button>
              <button
                onClick={handleBuild}
                disabled={loading || items.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white text-sm font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Build Palace
              </button>
            </div>
          </div>
        ) : (
          // WALKTHROUGH MODE
          <>
            <div className="flex-1 flex flex-col">
              <div className="px-6 py-3 border-b border-[#2A2A3A] bg-[#111118] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[#7A7A96] uppercase tracking-widest">
                  <span>Setting:</span>
                  <span className="text-[#F0EFFE] font-medium">{palace.setting}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={revealAll}
                    className="text-[10px] text-[#9090A8] hover:text-[#8B5CF6] uppercase tracking-widest font-bold px-2 py-1"
                  >
                    Reveal All
                  </button>
                  <button
                    onClick={reset}
                    className="text-[10px] text-[#9090A8] hover:text-[#8B5CF6] uppercase tracking-widest font-bold px-2 py-1"
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Station viewport */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStation}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 rounded-md bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[10px] text-[#8B5CF6] uppercase tracking-widest font-bold">
                        Station {currentStation + 1} / {palace.stations.length}
                      </div>
                      <div className="text-sm font-semibold text-[#F0EFFE]">
                        {palace.stations[currentStation].location}
                      </div>
                    </div>

                    {revealedStations.has(currentStation) ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 p-5 rounded-xl border border-[#7C3AED]/20 bg-gradient-to-br from-[#1A1A24] to-[#0E0E15]"
                      >
                        <div>
                          <span className="text-[10px] text-[#9090A8] uppercase tracking-widest">Item here:</span>
                          <div className="text-2xl text-[#F0EFFE] font-bold mt-1">
                            {palace.stations[currentStation].item}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#9090A8] uppercase tracking-widest">Visualize:</span>
                          <p className="text-base text-[#F0EFFE] mt-1 leading-relaxed">
                            {palace.stations[currentStation].imagery}
                          </p>
                        </div>
                        {palace.stations[currentStation].sensoryCue && (
                          <div>
                            <span className="text-[10px] text-[#9090A8] uppercase tracking-widest">Sensory cue:</span>
                            <p className="text-xs text-[#8B5CF6] mt-1 italic">
                              {palace.stations[currentStation].sensoryCue}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => revealThis(currentStation)}
                        className="w-full group flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-[#2A2A3A] bg-[#0E0E15] hover:border-[#7C3AED]/40 transition-colors"
                      >
                        <Eye className="mb-3 text-[#3A3A4F] group-hover:text-[#8B5CF6] transition-colors" size={32} />
                        <p className="text-sm text-[#9090A8] mb-1">Picture yourself walking into {palace.stations[currentStation].location}.</p>
                        <p className="text-[10px] text-[#7A7A96] uppercase tracking-widest">Click to reveal what's here</p>
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Recap at the end */}
                {currentStation === palace.stations.length - 1 && revealedStations.has(currentStation) && (
                  <div className="mt-8 p-5 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5">
                    <div className="text-[10px] text-[#FFD700] uppercase tracking-widest font-bold mb-2">Walk the palace once more</div>
                    <ul className="space-y-1 text-xs text-[#F0EFFE]">
                      {palace.recap.map((line, i) => (
                        <li key={i}>· {line}</li>
                      ))}
                    </ul>
                    <div className="mt-3 text-[#FFD700] italic font-serif text-base">
                      "{palace.mantra}"
                    </div>
                  </div>
                )}
              </div>

              {/* Walkthrough controls */}
              <div className="border-t border-[#2A2A3A] px-6 py-4 flex items-center justify-between gap-3 bg-[#111118]">
                <button
                  onClick={() => setCurrentStation(s => Math.max(0, s - 1))}
                  disabled={currentStation === 0}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-[#7A7A96] hover:text-[#F0EFFE] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto">
                  {palace.stations.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStation(i)}
                      className={`shrink-0 w-2 h-2 rounded-full transition-all ${
                        i === currentStation
                          ? 'bg-[#7C3AED] w-6'
                          : revealedStations.has(i)
                          ? 'bg-[#7C3AED]/50'
                          : 'bg-[#2A2A3A]'
                      }`}
                      title={s.location}
                    />
                  ))}
                </div>

                {currentStation === palace.stations.length - 1 ? (
                  <button
                    onClick={() => revealedStations.size >= palace.stations.length - 1 && revealThis(currentStation)}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-[#8B5CF6] hover:text-[#F0EFFE] font-bold uppercase tracking-widest"
                  >
                    Finish <Play size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!revealedStations.has(currentStation)) revealThis(currentStation);
                      setCurrentStation(s => Math.min(palace.stations.length - 1, s + 1));
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-[#9090A8] hover:text-[#F0EFFE]"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemoryPalaceBuilder;
