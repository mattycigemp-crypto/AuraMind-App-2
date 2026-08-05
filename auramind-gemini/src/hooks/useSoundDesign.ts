import { useCallback, useRef, useEffect } from "react";

interface SoundDesignOptions {
  volume?: number;
  enabled?: boolean;
}

const HOVER_FREQ = 800;
const CLICK_FREQ = 1200;
const SUCCESS_FREQ = 600;
const SCROLL_FREQ = 400;

function createOscillator(
  ctx: AudioContext,
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSoundDesign(options: SoundDesignOptions = {}) {
  const { volume = 0.15, enabled = true } = options;
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!enabled) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [enabled]);

  const playHover = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    createOscillator(ctx, HOVER_FREQ, 0.08, volume * 0.5, "sine");
  }, [getCtx, volume]);

  const playClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    createOscillator(ctx, CLICK_FREQ, 0.12, volume, "triangle");
  }, [getCtx, volume]);

  const playSuccess = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    createOscillator(ctx, SUCCESS_FREQ, 0.15, volume, "sine");
    setTimeout(() => createOscillator(ctx!, SUCCESS_FREQ * 1.5, 0.15, volume, "sine"), 100);
    setTimeout(() => createOscillator(ctx!, SUCCESS_FREQ * 2, 0.2, volume, "sine"), 200);
  }, [getCtx, volume]);

  const playScroll = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    createOscillator(ctx, SCROLL_FREQ, 0.06, volume * 0.3, "sine");
  }, [getCtx, volume]);

  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close();
      }
    };
  }, []);

  return { playHover, playClick, playSuccess, playScroll, enabled };
}
