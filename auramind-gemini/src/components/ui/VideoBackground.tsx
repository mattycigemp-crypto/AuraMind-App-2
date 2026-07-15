import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface VideoBackgroundProps {
  name: string;
  opacity?: number;
  blur?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  lazy?: boolean;
}

const BLUR_MAP: Record<string, string> = {
  sm: "blur-sm",
  md: "blur-md",
  lg: "blur-lg",
  xl: "blur-xl",
  "2xl": "blur-2xl",
};

export function VideoBackground({
  name,
  opacity = 0.5,
  blur,
  className,
  lazy = false,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tryPlay = () => el.play().catch(() => {});
    if (!lazy) { tryPlay(); return; }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else el.pause();
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload={lazy ? "metadata" : "auto"}
      poster={`/auramind/video/${name}-poster.jpg`}
      aria-hidden
      className={cn(
        "absolute inset-0 w-full h-full object-cover pointer-events-none",
        blur ? BLUR_MAP[blur] || "" : "",
        className,
      )}
      style={{ opacity }}
    >
      <source src={`/auramind/video/${name}.webm`} type="video/webm" />
      <source src={`/auramind/video/${name}.mp4`} type="video/mp4" />
    </video>
  );
}
