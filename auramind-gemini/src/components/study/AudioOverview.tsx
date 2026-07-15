import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon as Play,
  PauseIcon as Pause,
  StopIcon as Square,
  DownloadIcon as Download,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  Volume2Icon as Volume2,
  Loader2Icon as Loader2,
  SparklesIcon as Sparkles,
  Mic2Icon as Mic2,
  XIcon as X,
  RotateCcwIcon as RotateCcw,
} from '../icons/CustomIcons';
import { generateAudioOverview, cancelOverview, speakOverview } from '../../services/api/audioOverviewService';
import type { AudioOverviewScript, AudioOverviewSegment } from '../../services/api/audioOverviewService';

interface AudioOverviewProps {
  content: string;
  title: string;
  onClose?: () => void;
  className?: string;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

const AudioOverview: React.FC<AudioOverviewProps> = ({ content, title, onClose, className = '' }) => {
  const [script, setScript] = useState<AudioOverviewScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const playerRef = useRef<{ play: () => void; pause: () => void; resume: () => void; stop: () => void; isPlaying: () => boolean; getCurrentSegment: () => number } | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const checkVoices = () => setVoicesLoaded(true);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      } else {
        window.speechSynthesis.onvoiceschanged = checkVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
      }
    }
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      elapsedRef.current = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [isPlaying, isPaused]);

  useEffect(() => {
    return () => {
      cancelOverview();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateAudioOverview(content, title);
      setScript(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio overview');
      setScript(null);
    } finally {
      setIsGenerating(false);
    }
  }, [content, title]);

  const handlePlay = useCallback(() => {
    if (!script) return;

    if (playerRef.current && playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      return;
    }

    if (playerRef.current && isPaused) {
      playerRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (currentSegment >= script.segments.length) {
      setCurrentSegment(0);
      setElapsed(0);
    }

    const player = speakOverview(script, {
      onSegmentStart: (index: number) => {
        setCurrentSegment(index);
        setIsPlaying(true);
        setIsPaused(false);
      },
      onSegmentEnd: (index: number) => {
        setCurrentSegment(index + 1);
      },
      onDone: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSegment(script.segments.length);
      },
      onPause: () => {
        setIsPlaying(false);
        setIsPaused(true);
      },
      onResume: () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
    });

    playerRef.current = player;
    player.play();
    setIsPlaying(true);
    setIsPaused(false);
  }, [script, isPaused, currentSegment]);

  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    cancelOverview();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSegment(0);
    setElapsed(0);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (playerRef.current) {
      const wasPlaying = playerRef.current.isPlaying();
      const wasPaused = isPaused;
      const segIdx = currentSegment;

      playerRef.current.stop();
      cancelOverview();

      setIsPlaying(false);
      setIsPaused(false);

      if (wasPlaying || wasPaused) {
        setTimeout(() => {
          if (!script) return;
          const player = speakOverview({
            ...script,
          }, {
            onSegmentStart: (index: number) => {
              setCurrentSegment(index);
              setIsPlaying(true);
              setIsPaused(false);
            },
            onSegmentEnd: (index: number) => {
              setCurrentSegment(index + 1);
            },
            onDone: () => {
              setIsPlaying(false);
              setIsPaused(false);
              setCurrentSegment(script.segments.length);
            },
            onPause: () => {
              setIsPlaying(false);
              setIsPaused(true);
            },
            onResume: () => {
              setIsPlaying(true);
              setIsPaused(false);
            },
          });

          playerRef.current = player;

          const voiceMap: Record<string, string> = {
            host1: script.hosts[0].voice,
            host2: script.hosts[1].voice,
            narration: 'Google US English',
          };

          const skipSegments = script.segments.slice(0, Math.min(segIdx, script.segments.length));
          if (skipSegments.length > 0) {
            const lastPartial = skipSegments[skipSegments.length - 1];
            const partialScript = {
              ...script,
              segments: script.segments.slice(Math.min(segIdx, script.segments.length)),
            };

            const resumePlayer = speakOverview(partialScript, {
              onSegmentStart: (index: number) => {
                const realIndex = segIdx + index;
                setCurrentSegment(realIndex);
                setIsPlaying(true);
                setIsPaused(false);
              },
              onSegmentEnd: (index: number) => {
                setCurrentSegment(segIdx + index + 1);
              },
              onDone: () => {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentSegment(script.segments.length);
              },
              onPause: () => {
                setIsPlaying(false);
                setIsPaused(true);
              },
              onResume: () => {
                setIsPlaying(true);
                setIsPaused(false);
              },
            });
            playerRef.current = resumePlayer;
            resumePlayer.play();
          } else {
            player.play();
          }
        }, 50);
      }
    }
  }, [script, isPaused, currentSegment]);

  const handleDownload = useCallback(() => {
    if (!script) return;
    const lines = [script.title, '', ...script.segments.map((seg, i) => {
      const speakerName = seg.speaker === 'host1' ? script.hosts[0].name
        : seg.speaker === 'host2' ? script.hosts[1].name
        : 'Narrator';
      return `[${speakerName}]: ${seg.text}`;
    }), '', '--- Summary ---', script.summary];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [script]);

  const speakerLabel = (speaker: string, scriptData: AudioOverviewScript): string => {
    if (speaker === 'host1') return scriptData.hosts[0].name;
    if (speaker === 'host2') return scriptData.hosts[1].name;
    return 'Narrator';
  };

  const speakerColor = (speaker: string) => {
    switch (speaker) {
      case 'host1': return 'text-violet-400';
      case 'host2': return 'text-emerald-400';
      case 'narration': return 'text-zinc-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {!script && !isGenerating && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 px-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600/20 to-emerald-600/20 border border-violet-500/20 flex items-center justify-center mb-6">
            <Mic2 size={36} className="text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Audio Overview</h3>
          <p className="text-sm text-zinc-500 text-center max-w-md mb-8">
            Generate a podcast-style conversation about your study material.
            Two AI hosts will discuss the key concepts in an engaging, easy-to-follow format.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!voicesLoaded}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-emerald-600 text-white font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={20} />
            Generate Audio Overview
          </button>
          {!voicesLoaded && (
            <p className="mt-3 text-xs text-zinc-600">Loading speech synthesis...</p>
          )}
        </motion.div>
      )}

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-5"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Loader2 size={32} className="text-violet-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping opacity-25" />
          </div>
          <div className="text-center">
            <p className="text-zinc-100 font-semibold text-lg">Generating Audio Overview</p>
            <p className="text-zinc-500 text-sm mt-1">Creating a podcast-style discussion...</p>
          </div>
          <div className="flex gap-1.5">
            <motion.div
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      )}

      {error && !script && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 gap-4"
        >
          <div className="p-3 bg-red-500/10 rounded-full">
            <X size={24} className="text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium text-center max-w-md">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setError(null)}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {script && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Podcast Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-zinc-900 z-10">
                    {script.hosts[0].name[0]}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-zinc-900">
                    {script.hosts[1].name[0]}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{script.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {script.hosts[0].name} & {script.hosts[1].name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                  title="Download Transcript"
                >
                  <Download size={16} />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Podcast Player Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              {/* Host Avatars & Waveform */}
              <div className="flex items-center justify-center gap-8 py-4">
                {script.hosts.map((host, i) => {
                  const isCurrent = script.segments[currentSegment]?.speaker === `host${i + 1}`;
                  return (
                    <div key={host.name} className="flex flex-col items-center gap-2">
                      <motion.div
                        animate={isCurrent && isPlaying ? {
                          scale: [1, 1.08, 1],
                          transition: { duration: 0.8, repeat: Infinity },
                        } : { scale: 1 }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ring-2 transition-all ${
                          i === 0
                            ? 'bg-gradient-to-br from-violet-500 to-violet-700 ring-violet-500/30'
                            : 'bg-gradient-to-br from-emerald-500 to-emerald-700 ring-emerald-500/30'
                        } ${isCurrent && isPlaying ? 'ring-4 ring-offset-2 ring-offset-zinc-900' : ''}`}
                      >
                        {host.name[0]}
                      </motion.div>
                      <span className={`text-xs font-bold ${
                        isCurrent && isPlaying
                          ? i === 0 ? 'text-violet-400' : 'text-emerald-400'
                          : 'text-zinc-500'
                      }`}>
                        {host.name}
                      </span>
                      {isCurrent && isPlaying && (
                        <div className="flex gap-0.5 items-end h-3">
                          <motion.div
                            className="w-1 bg-violet-400 rounded-full"
                            animate={{ height: ['4px', '12px', '6px', '14px', '4px'] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-1 bg-violet-400 rounded-full"
                            animate={{ height: ['6px', '14px', '4px', '10px', '6px'] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                          />
                          <motion.div
                            className="w-1 bg-violet-400 rounded-full"
                            animate={{ height: ['4px', '8px', '14px', '6px', '4px'] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
                    style={{
                      width: `${script.segments.length > 0 ? (Math.min(currentSegment, script.segments.length) / script.segments.length) * 100 : 0}%`,
                    }}
                  />
                  {/* Segment tick marks */}
                  {script.segments.map((_, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 w-1 h-full ${
                        i < currentSegment ? 'bg-transparent' : 'bg-zinc-700/50'
                      }`}
                      style={{ left: `${(i / script.segments.length) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{formatTime(elapsed)}</span>
                  <span>{script.segments.length} segments</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleStop}
                  disabled={!isPlaying && !isPaused}
                  className="p-2.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Stop"
                >
                  <Square size={18} />
                </button>

                <button
                  onClick={handlePlay}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
                </button>

                {/* Speed Control */}
                <div className="flex items-center gap-1">
                  {SPEED_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        speed === s
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Summary</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{script.summary}</p>
            </div>

            {/* Transcript Toggle */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </button>

            {/* Transcript Panel */}
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                    {script.segments.map((seg, i) => {
                      const isActive = i === currentSegment && isPlaying;
                      const label = speakerLabel(seg.speaker, script);
                      const color = speakerColor(seg.speaker);
                      return (
                        <motion.div
                          key={i}
                          animate={isActive ? {
                            backgroundColor: 'rgba(139, 92, 246, 0.08)',
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                          } : {
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            borderColor: 'rgba(0, 0, 0, 0)',
                          }}
                          className="flex gap-3 p-2.5 rounded-xl border border-transparent transition-colors"
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-600'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold ${color} block mb-0.5`}>{label}</span>
                            <p className={`text-sm leading-relaxed ${
                              isActive ? 'text-zinc-100' : 'text-zinc-400'
                            }`}>
                              {seg.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioOverview;
