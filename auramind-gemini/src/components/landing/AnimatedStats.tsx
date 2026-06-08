import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { gsap } from 'gsap';

interface AnimatedNumberProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      { innerText: 0 },
      {
        innerText: target,
        duration,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate: function () {
          setDisplayNumber(Math.round(this.targets()[0] as any));
        },
      }
    );
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {displayNumber}
      {suffix}
    </span>
  );
};

interface StatItemProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  delay?: number;
}

export const StatItem: React.FC<StatItemProps> = ({
  value,
  label,
  suffix = '',
  prefix = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-5xl md:text-7xl font-black text-primary mb-2 tracking-tighter">
        <AnimatedNumber target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
};

interface StatWithIconProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

export const StatWithIcon: React.FC<StatWithIconProps> = ({
  icon,
  value,
  label,
  suffix = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-4 p-6 rounded-sm border border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-2xl font-black text-foreground">
          <AnimatedNumber target={value} suffix={suffix} />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </motion.div>
  );
};

interface CounterCircleProps {
  value: number;
  label: string;
  suffix?: string;
  color?: string;
}

export const CounterCircle: React.FC<CounterCircleProps> = ({
  value,
  label,
  suffix = '',
  color = '#a855f7',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative flex items-center justify-center"
    >
      <svg className="w-36 h-36 transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border"
        />
        {isInView && (
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference }}
            animate={{
              strokeDasharray: `${circumference * (1 - value / 100)} ${circumference}`,
            }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black text-foreground">
          <AnimatedNumber target={value} suffix={suffix} />
        </span>
      </div>
      <div className="absolute -bottom-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
};

export default AnimatedNumber;


