import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SparklesIcon as Sparkles, LayersIcon as Layers, TargetIcon as Target, RadarIcon as Radar, OrbitIcon as Orbit } from '../icons/CustomIcons';

const galleryItems = [
  {
    icon: Sparkles,
    tag: 'FEATURE-A',
    title: 'Better Memory',
    description: 'Turn short-term studying into longer-lasting memory with smart review timing.',
    stat: '94.7%',
    statLabel: 'Remembered',
  },
  {
    icon: Layers,
    tag: 'FEATURE-B',
    title: 'Build Understanding',
    description: 'Study ideas in the right order so each concept supports the next one.',
    stat: '3.2x',
    statLabel: 'More Depth',
  },
  {
    icon: Target,
    tag: 'FEATURE-C',
    title: 'Focus on Weak Spots',
    description: 'AI finds the topics you struggle with and gives them more attention.',
    stat: '0.08s',
    statLabel: 'Fast Help',
  },
  {
    icon: Radar,
    tag: 'FEATURE-D',
    title: 'Study Signals',
    description: 'Keep track of your progress and spot the best time to review.',
    stat: '24/7',
    statLabel: 'Always On',
  },
  {
    icon: Orbit,
    tag: 'FEATURE-E',
    title: 'Smart Review',
    description: 'Cards come back sooner when they are hard and later when you know them well.',
    stat: '∞',
    statLabel: 'Review Cycles',
  },
];

const HorizontalScrollGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-65%']);

  return (
    <section ref={containerRef} className="relative z-10 h-[600vh]" id="protocols">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-[var(--container-padding)] mb-10">
          <p className="text-eyebrow mb-4">Feature Highlights</p>
          <h2 className="text-impact-md text-foreground">HOW AURAMIND HELPS YOU STUDY.</h2>
        </div>

        <motion.div style={{ x }} className="flex gap-[var(--gap)] pl-[var(--container-padding)] pr-[20vw]">
          {galleryItems.map((item, i) => (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="glass-card-protocol clip-reveal-card signal-border group flex-shrink-0 w-[85vw] sm:w-[420px] lg:w-[480px] p-8 lg:p-10 flex flex-col justify-between min-h-[380px]"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="h-12 w-12 border border-primary/20 bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <item.icon size={22} />
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground/30 tracking-[.4em] uppercase">{item.tag}</span>
                </div>
                <h3 className="text-2xl font-black italic text-foreground mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.description}</p>
              </div>
              <div className="relative z-10 mt-8 pt-6 border-t border-border flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[.3em]">{item.statLabel}</p>
                  <p className="text-3xl font-black italic text-primary mt-1">{item.stat}</p>
                </div>
                <div className="h-2 w-2 bg-primary animate-pulse" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="px-[var(--container-padding)] mt-8 flex items-center gap-3">
          <motion.div
            animate={{ x: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-muted-foreground/30 text-xs font-black tracking-[.3em] uppercase"
          >
            {'SCROLL ->'}
          </motion.div>
          <div className="flex-1 h-[1px] bg-border" />
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollGallery;



