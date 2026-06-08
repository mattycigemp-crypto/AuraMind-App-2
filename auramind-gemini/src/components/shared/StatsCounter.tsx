import { useEffect, useRef, useState, type FC } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
}

const AnimatedCounter: FC<CounterProps> = ({ end, suffix = '', prefix = '', duration = 2, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  const format = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return n.toLocaleString();
  };

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-black italic text-primary leading-none">
        {prefix}{format(count)}{suffix}
      </p>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[.3em] mt-3">{label}</p>
    </div>
  );
};

const stats = [
  { end: 10_200_000, suffix: '+', label: 'Memories Retained', duration: 2.5 },
  { end: 94, suffix: '%', label: 'Avg Retention Rate', duration: 1.8 },
  { end: 127_000, suffix: '+', label: 'Active Learners', duration: 2.2 },
  { end: 4.9, suffix: '/5', label: 'User Rating', duration: 1.5 },
];

const StatsCounter = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-16 pt-16 border-t border-border"
    >
      {stats.map((stat) => (
        <AnimatedCounter
          key={stat.label}
          end={stat.end}
          suffix={stat.suffix}
          label={stat.label}
          duration={stat.duration}
        />
      ))}
    </motion.div>
  );
};

export default StatsCounter;



