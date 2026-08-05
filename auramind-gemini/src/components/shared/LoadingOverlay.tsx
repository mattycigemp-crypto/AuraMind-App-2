import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const NEURAL_DOTS = 8;
const SHIMMER_DELAYS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05];

const NeuralDot = ({ index }: { index: number }) => {
  const angle = (index / NEURAL_DOTS) * Math.PI * 2;
  const radius = 28;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const delay = SHIMMER_DELAYS[index];

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white/60"
      style={{ x: x - 2, y: y - 2 }}
      animate={{
        scale: [0, 1.2, 0],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
};

const ConnectionLine = ({ from, to }: { from: number; to: number }) => {
  const angleA = (from / NEURAL_DOTS) * Math.PI * 2;
  const angleB = (to / NEURAL_DOTS) * Math.PI * 2;
  const r = 28;
  const x1 = Math.cos(angleA) * r;
  const y1 = Math.sin(angleA) * r;
  const x2 = Math.cos(angleB) * r;
  const y2 = Math.sin(angleB) * r;
  const delay = (SHIMMER_DELAYS[from] + SHIMMER_DELAYS[to]) / 2;

  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{
        x: midX - 2,
        y: midY - 2,
        width: length,
        height: 2,
        originX: 0,
        rotate: angleDeg,
      }}
    >
      <motion.div
        className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          delay,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

const LoadingPhrase = ({ phrases }: { phrases: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={phrases[index]}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-[10px] font-mono text-zinc-500 tracking-wider"
      >
        {phrases[index]}
      </motion.p>
    </AnimatePresence>
  );
};

export const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.2 } }}
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none"
    style={{ background: "var(--color-arch-bg, #0a0a0a)" }}
  >
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(220,15%,15%)_0%,transparent_70%)]" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(120,120,255,0.04) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>

    <div className="relative flex flex-col items-center gap-10">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl border border-white/[0.03]"
            animate={{ scale: [1, 1.15 + i * 0.08, 1], opacity: [0.2, 0, 0.2] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
        <img
          src="/favicons,logos/favicon-32.png"
          alt="AuraMind"
          className="w-12 h-12 relative z-10 object-contain"
        />
        {Array.from({ length: NEURAL_DOTS }).map((_, i) => (
          <NeuralDot key={`dot-${i}`} index={i} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const next = (i + 1) % NEURAL_DOTS;
          return <ConnectionLine key={`line-${i}`} from={i} to={next} />;
        })}
      </div>

      <div className="space-y-4 text-center">
        <h2 className="text-xs font-black uppercase tracking-[0.5em] text-white/30">
          AuraMind
        </h2>
        <div className="flex items-center justify-center gap-[3px]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-[2px] h-3 rounded-full bg-white/40"
              animate={{
                height: [3, 14, 3],
                opacity: [0.15, 0.8, 0.15],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <LoadingPhrase
          phrases={[
            "Establishing neural link",
            "Loading your workspace",
            "Synchronizing data",
            "Almost ready",
          ]}
        />
      </div>
    </div>
  </motion.div>
);

export const RouteTransitionOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="route-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{ background: "var(--color-arch-bg, #0a0a0a)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-[3px]">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-[2px] h-3 rounded-full bg-white/30"
                animate={{
                  height: [3, 10, 3],
                  opacity: [0.1, 0.5, 0.1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
