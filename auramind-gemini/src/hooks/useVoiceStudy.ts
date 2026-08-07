/**
 * useVoiceStudy — hands-free study powered by the Web Speech API.
 *
 * All browser-quirk handling lives in services/voice/speechEngine.ts; this
 * hook is the React binding. Notable behaviour:
 *
 *   - `ttsSupported` and `sttSupported` are reported separately. Firefox has
 *     speech synthesis but no recognition, and a single flag made listening
 *     fail silently there.
 *   - Voices are loaded asynchronously. `getVoices()` is empty on its first
 *     call in Chrome/Edge, which previously meant a selected voice was
 *     silently ignored on every session.
 *   - Recognition errors surface as a typed `error` object instead of being
 *     swallowed, so the UI can tell a denied microphone apart from silence.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRecognition,
  describeSpeechError,
  getSpeechCapabilities,
  loadVoices,
  pickPreferredVoice,
  UNSUPPORTED_STT_ERROR,
  type SpeechError,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '../services/voice/speechEngine';

export interface VoiceStudyState {
  speaking: boolean;
  listening: boolean;
  /** True when either capability exists. Prefer the specific flags below. */
  supported: boolean;
  ttsSupported: boolean;
  sttSupported: boolean;
  /** True once the async voice list has resolved. */
  voicesReady: boolean;
  transcript: string;
  interimTranscript: string;
  /** Last recognition failure, or null. Cleared when listening restarts. */
  error: SpeechError | null;
  clearError: () => void;
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
  /** Keep listening across natural pauses. Essential for hands-free use. */
  continuous?: boolean;
  onTranscript?: (transcript: string) => void;
  onError?: (error: SpeechError) => void;
}): VoiceStudyState {
  const {
    voiceURI,
    rate = 1,
    pitch = 1,
    lang = 'en-US',
    continuous = true,
    onTranscript,
    onError,
  } = options ?? {};

  const [caps] = useState(() => getSpeechCapabilities());
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechError | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);

  // Written only from callbacks — never during render.
  const transcriptRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Distinguishes a user-initiated stop from the engine ending on its own.
  const manualStopRef = useRef(false);

  // Keep the latest callbacks without re-creating start/stop each render.
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  useEffect(() => {
    if (!caps.tts) {
      setVoicesReady(true);
      return;
    }
    let alive = true;
    loadVoices().then((v) => {
      if (!alive) return;
      setVoices(v);
      setVoicesReady(true);
    });
    return () => {
      alive = false;
    };
  }, [caps.tts]);

  // ── Speak ──────────────────────────────────────────────────────────────

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!caps.tts || typeof window === 'undefined') return;
      if (!text.trim()) {
        onEnd?.();
        return;
      }
      const synth = window.speechSynthesis;
      const cleaned = text.replace(/\s+/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;
      const preferred = pickPreferredVoice(voices, voiceURI, lang);
      if (preferred) utterance.voice = preferred;

      let finished = false;
      const finish = (withEnd: boolean) => {
        if (finished) return;
        finished = true;
        setSpeaking(false);
        if (withEnd) onEnd?.();
      };
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      // Remove handlers on end so a cancelled utterance can't call onEnd twice.
      utterance.onend = () => {
        finish(true);
        utterance.onend = null;
        utterance.onerror = null;
      };

      synth.cancel();
      synth.speak(utterance);
    },
    [caps.tts, voices, voiceURI, rate, pitch, lang],
  );

  const cancelSpeech = useCallback(() => {
    if (!caps.tts || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [caps.tts]);

  // ── Recognition ────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!caps.stt) {
      setError(UNSUPPORTED_STT_ERROR);
      onErrorRef.current?.(UNSUPPORTED_STT_ERROR);
      return;
    }
    const recognition = createRecognition({ lang, continuous });
    if (!recognition) {
      setError(UNSUPPORTED_STT_ERROR);
      onErrorRef.current?.(UNSUPPORTED_STT_ERROR);
      return;
    }

    manualStopRef.current = false;
    recognitionRef.current = recognition;
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let final = transcriptRef.current;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      transcriptRef.current = final;
      setTranscript(final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: { error: string; message?: string }) => {
      const err = describeSpeechError(event.error);
      setError(err);
      onErrorRef.current?.(err);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
      const final = transcriptRef.current;
      if (!manualStopRef.current && final && continuous) {
        // Continuous engine timed out on its own (paused at end of sentence);
        // hand the final transcript through and optionally restart.
        onTranscriptRef.current?.(final);
      }
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError({
        code: 'unknown',
        message: 'Voice input hit a snag — tap to try again.',
        recoverable: true,
        needsPermission: false,
      });
    }
  }, [caps.stt, lang, continuous]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    const active = recognitionRef.current;
    recognitionRef.current = null;
    if (active) {
      try {
        active.stop();
      } catch {
        /* already stopped */
      }
    }
    setListening(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Release engine on unmount.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* no-op */
      }
      if (caps.tts && typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [caps.tts]);

  return {
    speaking,
    listening,
    supported: caps.tts || caps.stt,
    ttsSupported: caps.tts,
    sttSupported: caps.stt,
    voicesReady,
    transcript,
    interimTranscript,
    error,
    clearError,
    speak,
    cancelSpeech,
    startListening,
    stopListening,
  };
}