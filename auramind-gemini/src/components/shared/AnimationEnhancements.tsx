// Enhanced SVG animations for AnimatedBrain - Line drawing effects
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SVGLineDrawProps {
  className?: string;
}

// SVG Line Drawing Animation Hook
export function useSVGLineDraw(svgRef: React.RefObject<SVGSVGElement>) {
  useEffect(() => {
    if (!svgRef.current) return;

    const paths = svgRef.current.querySelectorAll("path");

    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.animation = "draw 3s ease-out forwards";
    });
  }, [svgRef]);
}

// Horizontal Scroll Showcase Component
export function HorizontalShowcase() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("horizontal-showcase");
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)),
      );
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cards = [
    {
      title: "AI-Powered Learning",
      icon: "AI",
      description: "Smart flashcards that adapt to your memory",
    },
    { title: "FSRS Algorithm", icon: "FS", description: "Forgetting curve optimization" },
    { title: "Multi-Modal", icon: "MM", description: "Text, images, and audio support" },
    { title: "Mistake Tracking", icon: "MT", description: "Never forget what you got wrong" },
    { title: "Progress Analytics", icon: "PA", description: "Track your learning journey" },
  ];

  return (
    <section id="horizontal-showcase" className="relative h-screen overflow-hidden">
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${scrollProgress * (cards.length - 1) * 25}%)`,
        }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={i}
            className="w-screen h-full flex-shrink-0 flex items-center justify-center p-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: scrollProgress > i * 0.2 && scrollProgress < (i + 1) * 0.2 + 0.2 ? 1 : 0.5,
              scale: scrollProgress > i * 0.2 && scrollProgress < (i + 1) * 0.2 + 0.2 ? 1 : 0.8,
            }}
          >
            <div className="max-w-2xl text-center">
              <span className="text-8xl mb-8 block">{card.icon}</span>
              <h2 className="text-5xl font-black mb-4">{card.title}</h2>
              <p className="text-xl text-muted-foreground">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Achievement Confetti Component
interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  scale: number;
  rotate: number;
}

export function AchievementConfetti({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#A855F7"];
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
        rotate: Math.random() * 360,
      }));
      setPieces(newPieces);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3"
              style={{
                backgroundColor: piece.color,
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                scale: piece.scale,
              }}
              initial={{ opacity: 1, rotate: 0, y: 0 }}
              animate={{
                opacity: 0,
                rotate: piece.rotate,
                y: -200,
                x: `${(Math.random() - 0.5) * 200}px`,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: piece.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Blur Reveal Component
export function BlurReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulse Glow Effect
export function PulseGlow({
  children,
  className,
  color = "#a855f7",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full opacity-30"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {children}
    </div>
  );
}

// Staggered Children Animation
export function StaggeredChildren({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
}: {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Scroll Progress Indicator
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = (scrolled / maxScroll) * 100;
      setProgress(progressPercent);
    };

    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-primary z-[200]"
      style={{ width: `${progress}%`, top: 'var(--safe-top, 0px)' }}
      transition={{ duration: 0.1 }}
    />
  );
}
