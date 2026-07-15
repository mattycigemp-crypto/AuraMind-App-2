"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "../../lib/auramind/hooks";

/* CustomCursor — a violet dot + trailing ring that grows on hover */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.body.classList.add("custom-cursor-active");

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      const target = e.target as HTMLElement;
      const interactive = target.closest('button, a, [role="button"], input, textarea, select, [data-cursor="hover"]');
      if (interactive) {
        dot.classList.add("cursor-hover");
        ring.classList.add("cursor-hover");
      } else {
        dot.classList.remove("cursor-hover");
        ring.classList.remove("cursor-hover");
      }
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
    </>
  );
}

/* MagneticButton — wraps any element, pulls toward cursor */
export function MagneticButton({
  children,
  strength = 0.35,
  className = "",
  as: As = "button",
  ...rest
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  as?: "button" | "a" | "div";
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0, 0)";
  };

  return (
    <As
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

/* Marquee — infinite scrolling text band with mask-image fade edges */
export function Marquee({
  items,
  duration = 30,
  className = "",
  separator = "\u00b7",
}: {
  items: string[];
  duration?: number;
  className?: string;
  separator?: string;
}) {
  return (
    <div className={`marquee ${className}`}>
      <div className="marquee-track" style={{ ["--marquee-duration" as string]: `${duration}s` }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            <span>{item}</span>
            <span className="text-violet-500/40">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* MeshGradient — animated blurred color blobs behind content */
export function MeshGradient({ className = "", opacity = 0.45 }: { className?: string; opacity?: number }) {
  return <div aria-hidden className={`mesh-gradient ${className}`} style={{ opacity }} />;
}

/* WordReveal — text that reveals word-by-word with a mask wipe */
export function WordReveal({
  text,
  className = "",
  delay = 0,
  as: As = "div",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const words = text.split(" ");

  return (
    <As ref={ref as never} className={className}>
      {words.map((word, i) => (
        <span key={i} className="word-reveal mr-[0.25em]" style={{ transitionDelay: `${delay + i * 60}ms` }}>
          <span
            style={{
              display: "inline-block",
              transform: inView ? "translateY(0%)" : "translateY(110%)",
              transition: `transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay + i * 60}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </As>
  );
}

/* LoadingScreen — cinematic intro that fades after first paint */
export function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`loader-mask ${hidden ? "hidden" : ""}`}>
      <div className="loader-wordmark">
        <span style={{ animationDelay: "0ms" }}>Aura</span>
        <span className="font-serif italic text-violet-400">Mind</span>
      </div>
      <div className="loader-bar" />
    </div>
  );
}

/* PageTransition — wipes between views via CSS clip-path animation */
export function PageTransition({ trigger }: { trigger: unknown }) {
  return (
    <div
      key={String(trigger)}
      aria-hidden
      onAnimationEnd={(e) => { (e.currentTarget as HTMLDivElement).style.display = "none"; }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99990,
        background: "#0A0A0F",
        pointerEvents: "none",
        animation: "page-wipe 600ms cubic-bezier(0.76, 0, 0.24, 1) forwards",
      }}
    />
  );
}
