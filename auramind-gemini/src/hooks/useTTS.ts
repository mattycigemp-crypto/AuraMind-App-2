import { useState, useRef, useCallback, useEffect } from "react";
import { useAppPreference } from "../lib/appPreferences";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
}

export interface UseTTSReturn {
  isSpeaking: boolean;
  isEnabled: boolean;
  /** True when this browser exposes speechSynthesis at all. */
  supported: boolean;
  toggle: () => void;
  speak: (text: string) => void;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/^>\s/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function useTTS(options: TTSOptions = {}): UseTTSReturn {
  const { rate = 0.95, pitch = 1.0 } = options;
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";

  const [isSpeaking, setIsSpeaking] = useState(false);
  // Keep chat voice output and the Settings > Audio preference on the same
  // switch. The old hook used a private storage key, so enabling "Read cards
  // aloud" had no effect in chat and the header toggle reset on every surface.
  const [isEnabled, setIsEnabled] = useAppPreference<boolean>("auramind_textToSpeech", false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  // Set false by the unmount effect so late `onend`/`onerror` callbacks
  // never call setState after the component is gone.
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    queueRef.current = [];
    if (mountedRef.current) setIsSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      if (!isEnabled || !text.trim()) return;

      const cleaned = stripMarkdown(text);
      if (!cleaned) return;

      // The previous utterance (if any) is superseded; draining the queue
      // here is intentional so `speak` is "speak this now".
      stop();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (preferred) utterance.voice = preferred;

      const safeSetSpeaking = (v: boolean) => {
        if (mountedRef.current) setIsSpeaking(v);
      };

      utterance.onstart = () => safeSetSpeaking(true);
      utterance.onend = () => {
        safeSetSpeaking(false);
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        const next = queueRef.current.shift();
        if (next !== undefined) speak(next);
      };
      utterance.onerror = () => {
        safeSetSpeaking(false);
        if (utteranceRef.current === utterance) utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isEnabled, rate, pitch, stop, supported],
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (isSpeaking) {
      stop();
    } else {
      setIsEnabled((prev) => !prev);
    }
  }, [isSpeaking, setIsEnabled, stop, supported]);

  const setEnabled = useCallback(
    (v: boolean) => {
      setIsEnabled(v);
      if (!v) stop();
    },
    [setIsEnabled, stop],
  );

  return { isSpeaking, isEnabled, supported, toggle, speak, stop, setEnabled };
}
