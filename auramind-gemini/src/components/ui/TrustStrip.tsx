"use client";

import { motion } from "framer-motion";
import { useCountUp, useInView } from "@/lib/auramind/hooks";
import { useRef } from "react";

export function TrustStrip() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const learnersCount = useCountUp(1248, 1500, inView);
  const cardsCount = useCountUp(84000, 1800, inView);
  const retentionPct = useCountUp(91, 1400, inView);

  return (
    <section ref={ref} className="border-y border-[#2A2A3A] bg-[#0A0A0F] py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
        <div className="text-center">
          <div className="font-serif text-4xl italic text-[#F0EFFE] md:text-5xl tabular-nums">
            {learnersCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-[#5A5A72]">
            Active learners
          </div>
        </div>

        <div className="text-center md:border-x md:border-[#2A2A3A]">
          <div className="font-serif text-4xl italic text-[#F0EFFE] md:text-5xl tabular-nums">
            {cardsCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-[#5A5A72]">
            Cards reviewed
          </div>
        </div>

        <div className="text-center">
          <div className="font-serif text-4xl italic text-[#F0EFFE] md:text-5xl tabular-nums">
            {retentionPct}%
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-[#5A5A72]">
            Avg retention
          </div>
        </div>
      </div>
    </section>
  );
}
