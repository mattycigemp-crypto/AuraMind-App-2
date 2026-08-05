/**
 * useAudioRecorder — records microphone audio via the MediaRecorder API.
 *
 * Returns the finished Blob (webm) ready for Whisper transcription, plus
 * live capture state. Degrades cleanly when the mic is denied or the API
 * is unavailable (insecure context / older Safari).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioRecorderState {
  recording: boolean;
  supported: boolean;
  error: string | null;
  blob: Blob | null;
  durationMs: number;
  start: () => Promise<void>;
  stop: () => Blob | null;
  cancel: () => void;
  clear: () => void;
}

const MIME_TYPE = 'audio/webm';

export function useAudioRecorder(maxDurationMs = 15 * 60 * 1000): AudioRecorderState {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(
    typeof navigator !== 'undefined' && typeof MediaRecorder !== 'undefined' &&
    (navigator.mediaDevices?.getUserMedia != null),
  );
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Keep a ref to the latest blob so `stop` can return it synchronously.
  const blobRef = useRef<Blob | null>(null);
  blobRef.current = blob;

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      cleanupStream();
    };
  }, [cleanupStream]);

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const full = new Blob(chunksRef.current, { type: recorder.mimeType || MIME_TYPE });
        setBlob(full);
        cleanupStream();
        setRecording(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
      };

      recorder.onerror = () => {
        setError('Recording failed — please try again.');
        setRecording(false);
        cleanupStream();
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);
        if (elapsed >= maxDurationMs) stop();
      }, 1000);
    } catch {
      setError('Microphone access denied or unavailable.');
      setSupported(false);
    }
  }, [maxDurationMs, cleanupStream]);

  const stop = useCallback((): Blob | null => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return blobRef.current;
    try {
      recorder.stop();
    } catch {
      /* no-op */
    }
    return blobRef.current;
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try {
      recorderRef.current?.stop();
    } catch {
      /* no-op */
    }
    chunksRef.current = [];
    setRecording(false);
    setBlob(null);
    setDurationMs(0);
    cleanupStream();
  }, [cleanupStream]);

  const clear = useCallback(() => {
    setBlob(null);
    setDurationMs(0);
  }, []);

  return { recording, supported, error, blob, durationMs, start, stop, cancel, clear };
}
