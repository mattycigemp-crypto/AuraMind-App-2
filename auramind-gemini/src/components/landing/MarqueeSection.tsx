import React, { forwardRef } from 'react';

const marqueeItems = [
  'ACTIVE RECALL',
  'SMART REVIEW',
  'SPACED REPETITION',
  'REVIEW TIMING',
  'AI FLASHCARDS',
  'STUDY INSIGHTS',
  'FOCUS TOOLS',
  'PROGRESS TRACKING',
];

const MarqueeSection = forwardRef<HTMLDivElement>((_, ref) => {
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <div ref={ref} className="relative z-10 border-y border-border bg-primary py-5 overflow-hidden">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 px-8 text-[11px] font-black tracking-[0.4em] text-primary-foreground uppercase whitespace-nowrap"
          >
            {item}
            <span className="inline-block h-1.5 w-1.5 bg-primary-foreground/40 rotate-45" />
          </span>
        ))}
      </div>
    </div>
  );
});

MarqueeSection.displayName = 'MarqueeSection';

export default MarqueeSection;
