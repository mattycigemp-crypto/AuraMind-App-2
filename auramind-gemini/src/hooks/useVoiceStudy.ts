/**
 * useVoiceStudy — hands‑free study mode powered by the browser's Web Speech
 * API. No extra downloads. Works in Chrome, Edge and Safari.
 *
 * Capabilities:
 *   speak(text)      → TTS reads text aloud
 *   startListening() → begin recognising the student's spoken answer
 *   stopListening()  → stop recognition early and return the transcript
 *   speaking         → reactive: TTS currently reading
 *   listening        → reactive: mic currently capturing
 *   transcript       → finalised transcript of the last utterance
 *   interimTranscript → live partial transcript while listening
 *   supported        → whether any Web Speech capability exists
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface VoiceStudyState {
  speaking: boolean;
  listening: boolean;
  supported: boolean;
  transcript: string;
  interimTranscript: string;
  speak: (text: string, onEnd?: () => void) => void;
  cancelSpeech: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceStudy(options?: {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
  onTranscript?: (transcript: string) => void;
}): VoiceStudyState {
  const { voiceURI, rate = 1, pitch = 1, onTranscript } = options ?? {};

  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const transcriptRef = useRef('');
  transcriptRef.current = transcript;

  const supported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window || 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  // ── TTS ───────────────────────────────────────────────────────────────
  const ttsVoices = useMemo(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      setSpeaking(true);
      setTranscript('');
      setInterimTranscript('');

      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceURI) {
        const match = ttsVoices.find(v => v.voiceURI === voiceURI);
        if (match) utterance.voice = match;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = options?.lang ?? 'en-US';

      const done = () => {
        setSpeaking(false);
        onEnd?.();
      };
      utterance.onend = done;
      utterance.onerror = () => done();
      window.speechSynthesis.speak(utterance);
    },
    [ttsVoices, voiceURI, rate, pitch, options?.lang],
  );

  const cancelSpeech = useCallback(() => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // ── STT ───────────────────────────────────────────────────────────────
  const recognitionRef = useRef<any>(null);

  const getRecognition = useCallback((): any => {
    if (typeof window === 'undefined') return null;
    const Ctor =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = options?.lang ?? 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    return rec;
  }, [options?.lang]);

  const finishTranscript = useCallback(
    (finalText: string) => {
      setTranscript(finalText);
      if (finalText.trim() && onTranscript) onTranscript(finalText.trim());
    },
    [onTranscript],
  );

  const startListening = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    setListening(true);
    setInterimTranscript('');

    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) transcriptRef.current = final;
      setTranscript(transcriptRef.current);
      setInterimTranscript(interim);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      finishTranscript(transcriptRef.current);
    };

    try {
      rec.start();
    } catch {
      /* already started */
    }
  }, [getRecognition, finishTranscript]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* no-op */
    }
    setListening(false);
    finishTranscript(transcriptRef.current);
  }, [finishTranscript]);

  // If the consumer destroys the hook mid-recording, tear it down cleanly.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* no-op */
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speaking,
    listening,
    supported,
    transcript,
    interimTranscript,
    speak,
    cancelSpeech,
    startListening,
    stopListening,
  };
}
