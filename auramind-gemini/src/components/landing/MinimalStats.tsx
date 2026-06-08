import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface StatItem {
  value: number;
  label: string;
  suffix: string;
  prefix?: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { value: 10, label: 'Cards Created', suffix: 'M+', prefix: '' },
  { value: 98, label: 'Avg Retention Rate', suffix: '%', prefix: '' },
  { value: 50000, label: 'Active Learners', suffix: '+', prefix: '' },
  { value: 120, label: 'Minutes Saved Weekly', suffix: '', prefix: '' },
];

function useCountUp(end: number, isInView: boolean, duration: number = 2, decimals: number = 0): string {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, isInView, duration]);

  if (decimals > 0) {
    return count.toFixed(decimals);
  }
  return Math.floor(count).toLocaleString();
}

function formatStat(s: StatItem, value: string): string {
  return `${s.prefix || ''}${value}${s.suffix || ''}`;
}

interface MinimalStatsProps {
  className?: string;
}

const MinimalStats: React.FC<MinimalStatsProps> = ({ className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className={`py-20 md:py-24 border-y border-zinc-800/50 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center overflow-hidden"
            >
              <div className="text-3xl md:text-5xl font-black text-foreground mb-2 tabular-nums">
                {formatStat(stat, useCountUp(stat.value, isInView, 2, stat.decimals || 0))}
              </div>
              <div className="text-xs md:text-sm text-zinc-500 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { MinimalStats };



