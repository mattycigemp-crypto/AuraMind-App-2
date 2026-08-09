import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Presentation } from '../../types';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import {
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  PlayIcon as Play,
  PauseIcon as Pause,
  Volume2Icon as Volume2,
  Maximize2Icon as Maximize2,
  RotateCcwIcon as RotateCcw,
} from '../icons/CustomIcons';

interface ChatPresentationProps {
  presentation: Presentation;
}

const ChatPresentation: React.FC<ChatPresentationProps> = ({ presentation }) => {
  const workspace = useDashboardWorkspace();
  const aiVoiceEnabled = useFeatureFlag(
    'ai_voice_mode',
    workspace?.user?.id,
    workspace?.user?.role,
    workspace?.user?.plan,
    workspace?.user?.isAdmin,
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [_isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPlaying(false);
  }, []);

  const speak = useCallback((text: string) => {
    stopSpeaking();
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isPlaying && currentSlide < presentation.slides.length - 1) {
        setTimeout(() => setCurrentSlide(s => s + 1), 1000);
      } else {
        setIsPlaying(false);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking, isPlaying, currentSlide, presentation.slides.length]);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (isPlaying && !isSpeaking) {
      speak(presentation.slides[currentSlide].script);
    }
  }, [isPlaying, currentSlide, isSpeaking, speak, presentation.slides]);

  const togglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      setIsPlaying(true);
      speak(presentation.slides[currentSlide].script);
    }
  };

  const goToSlide = (index: number) => {
    stopSpeaking();
    setCurrentSlide(index);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const slide = presentation.slides[currentSlide];

  return (
    <div ref={containerRef} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-100 truncate">{presentation.title}</h3>
        <span className="text-xs text-zinc-500 shrink-0">{currentSlide + 1} / {presentation.slides.length}</span>
      </div>

      <div className="p-6 md:p-8 min-h-[280px] flex flex-col justify-center">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{slide.title}</h2>
        <ul className="space-y-3">
          {slide.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-3 text-sm md:text-base text-zinc-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide === 0}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          ><ChevronLeft className="w-4 h-4" /></button>
          {aiVoiceEnabled && (
            <button onClick={togglePlay}
              className="p-2 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
            >{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
          )}
          <button onClick={() => goToSlide(currentSlide + 1)} disabled={currentSlide >= presentation.slides.length - 1}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          ><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-1">
          {isSpeaking && aiVoiceEnabled && <Volume2 className="w-3.5 h-3.5 text-violet-400 animate-pulse" />}
          <button onClick={() => { stopSpeaking(); setCurrentSlide(0); }}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Restart"
          ><RotateCcw className="w-4 h-4" /></button>
          <button onClick={toggleFullscreen}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Fullscreen"
          ><Maximize2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex justify-center gap-1 px-4 pb-4">
        {presentation.slides.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-violet-400 w-4' : 'bg-zinc-700 hover:bg-zinc-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatPresentation;



