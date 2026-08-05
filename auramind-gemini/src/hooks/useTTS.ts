import { useState, useRef, useCallback, useEffect } from 'react';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
}

export interface UseTTSReturn {
  isSpeaking: boolean;
  isEnabled: boolean;
  toggle: () => void;
  speak: (text: string) => void;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'auramind.tts.enabled.v1';

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/^>\s/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

export function useTTS(options: TTSOptions = {}): UseTTSReturn {
  const { rate = 0.95, pitch = 1.0 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isEnabled));
    } catch { /* ignore */ }
  }, [isEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    queueRef.current = [];
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isEnabled || !text.trim()) return;

    const cleaned = stripMarkdown(text);
    if (!cleaned) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        speak(next);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled, rate, pitch, stop]);

  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      setIsEnabled(prev => !prev);
    }
  }, [isSpeaking, stop]);

  const setEnabled = useCallback((v: boolean) => {
    setIsEnabled(v);
    if (!v) stop();
  }, [stop]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { isSpeaking, isEnabled, toggle, speak, stop, setEnabled };
}
