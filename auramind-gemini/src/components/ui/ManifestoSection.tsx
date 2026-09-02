"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { Star } from "@/components/icons";
import { VideoBackground } from "./VideoBackground";

/**
 * ManifestoSection - the "Memory is not a side effect of learning" interlude.
 *
 * Text reveals word-by-word as the user scrolls: each word's opacity is bound
 * to its own slice of the section's scroll progress, so the manifesto is
 * *read* at scroll speed instead of fading in as opaque line blocks.
 * (Pattern popularized by premium editorial landing pages; adapted from the
 * MotionSites "Mindloop" motion design.)
 *
 * The section is intentionally tall (180vh) with a sticky viewport so the
 * whole passage plays out before the next section arrives.
 */

interface WordSpec {
  text: string;
  accent?: boolean;
}

// The manifesto broken into per-word specs. `accent` words get the serif
// italic violet treatment (matches the hero's "Actually" styling).
const MANIFESTO_LINES: WordSpec[][] = [
  [
    { text: "Memory" }, { text: "is" }, { text: "not" }, { text: "a" },
    { text: "side" }, { text: "effect" }, { text: "of" }, { text: "learning." },
  ],
  [
    { text: "It", accent: true }, { text: "is", accent: true },
    { text: "the" }, { text: "learning." },
  ],
  [
    { text: "And" }, { text: "memory" }, { text: "has" }, { text: "a" },
    { text: "shape", accent: true }, { text: "\u2014" }, { text: "a" },
    { text: "curve,", accent: true }, { text: "a" },
    { text: "rhythm,", accent: true }, { text: "a" },
    { text: "right" }, { text: "time" }, { text: "to" },
    { text: "return.", accent: true },
  ],
  [
    { text: "AuraMind" }, { text: "shows" }, { text: "up" }, { text: "at" },
    { text: "that" }, { text: "exact" }, { text: "moment.", accent: true },
  ],
];

const TOTAL_WORDS = MANIFESTO_LINES.reduce((n, line) => n + line.length, 0);

// Scroll window the whole passage plays across (fraction of section progress).
const REVEAL_START = 0.12;
const REVEAL_END = 0.78;
const STEP = (REVEAL_END - REVEAL_START) / TOTAL_WORDS;
// Each word brightens over this much scroll, overlapping its neighbours.
const WORD_SPAN = STEP * 6;

/** One word. Its own component so useTransform hooks stay per-word. */
function RevealWord({
  progress,
  index,
  word,
}: {
  progress: MotionValue<number>;
  index: number;
  word: WordSpec;
}) {
  const start = REVEAL_START + index * STEP;
  const opacity = useTransform(
    progress,
    [start, Math.min(start + WORD_SPAN, REVEAL_END)],
    [0.12, 1],
  );
  return (
    <motion.span style={{ opacity }} className={word.accent ? "font-serif italic text-violet-400" : undefined}>
      {word.text}
      {" "}
    </motion.span>
  );
}

export function ManifestoSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.05]);
  const outroOpacity = useTransform(scrollYProgress, [0.78, 0.88], [0, 1]);

  // Running word index across all lines.
  let wordIndex = -1;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[120vh] items-center justify-center overflow-hidden border-t border-[#2A2A3A] bg-[#0A0A0F] px-6"
    >
      <VideoBackground name="manifesto" opacity={0.25} lazy />

      <motion.div
        style={{ scale }}
        className="sticky top-0 flex min-h-screen max-w-4xl flex-col items-center justify-center py-32 text-center"
      >
        <div className="mb-8 text-xs uppercase tracking-[0.3em] text-violet-400">
          <span className="aurora-text">The Manifesto</span>
        </div>

        <div className="space-y-3 text-3xl font-medium leading-tight tracking-tight md:text-5xl md:leading-[1.15]">
          {MANIFESTO_LINES.map((line, lineIdx) => (
            <p key={lineIdx} className="text-[#F0EFFE]">
              {line.map((word) => {
                wordIndex += 1;
                return (
                  <RevealWord
                    key={`${lineIdx}-${word.text}-${wordIndex}`}
                    progress={scrollYProgress}
                    index={wordIndex}
                    word={word}
                  />
                );
              })}
            </p>
          ))}
        </div>

        <motion.div
          style={{ opacity: outroOpacity }}
          className="mt-12 flex items-center gap-2 text-sm text-[#7A7A96]"
        >
          <Star className="h-4 w-4 text-violet-400" />
          <span>That&apos;s it. That&apos;s the whole product.</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
