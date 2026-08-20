"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star } from "@/components/icons";
import { VideoBackground } from "./VideoBackground";

export function ManifestoSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const line1Opacity = useTransform(scrollYProgress, [0.1, 0.25, 0.6, 0.75], [0.15, 1, 1, 0.15]);
  const line2Opacity = useTransform(scrollYProgress, [0.2, 0.35, 0.65, 0.8], [0.15, 1, 1, 0.15]);
  const line3Opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.7, 0.85], [0.15, 1, 1, 0.15]);
  const line4Opacity = useTransform(scrollYProgress, [0.4, 0.55, 0.75, 0.9], [0.15, 1, 1, 0.15]);

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.05]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[180vh] items-center justify-center overflow-hidden border-t border-[#2A2A3A] bg-[#0A0A0F] px-6"
    >
      <VideoBackground name="manifesto" opacity={0.25} lazy />

      <motion.div
        style={{ scale }}
        className="sticky top-0 flex min-h-screen max-w-4xl flex-col items-center justify-center py-32 text-center"
      >
        <div className="mb-8 text-xs uppercase tracking-[0.3em] text-violet-400">
          <span className="aurora-text">The Manifesto</span>
        </div>

        <div className="space-y-2 text-3xl font-medium leading-tight tracking-tight md:text-5xl md:leading-[1.1]">
          <motion.p style={{ opacity: line1Opacity }} className="text-[#F0EFFE]">
            Memory is not a side effect of learning.
          </motion.p>
          <motion.p style={{ opacity: line2Opacity }} className="text-[#9090A8]">
            <span className="font-serif italic text-violet-400">It is</span> the learning.
          </motion.p>
          <motion.p style={{ opacity: line3Opacity }} className="text-[#9090A8]">
            And memory has a shape — a curve, a rhythm, a right time to return.
          </motion.p>
          <motion.p style={{ opacity: line4Opacity }} className="text-[#F0EFFE]">
            AuraMind shows up at that exact moment.
          </motion.p>
        </div>

        <motion.div
          style={{ opacity: line4Opacity }}
          className="mt-12 flex items-center gap-2 text-sm text-[#7A7A96]"
        >
          <Star className="h-4 w-4 text-violet-400" />
          <span>That&apos;s it. That&apos;s the whole product.</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
