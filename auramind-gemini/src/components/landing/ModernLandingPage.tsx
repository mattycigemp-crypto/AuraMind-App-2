import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Flashcard } from "../auramind/flashcard";
import { MagneticButton } from "../ui/MagneticButton";
import { Marquee } from "../ui/Marquee";
import { ManifestoSection } from "../ui/ManifestoSection";
import { AIGenerationDemoSection } from "../ui/AIGenerationDemoSection";
import { TrustStrip } from "../ui/TrustStrip";
import { VideoBackground } from "../ui/VideoBackground";
import type { FlashcardData } from "@/lib/auramind/types";


const HERO_CARD: FlashcardData = {
  id: "hero-1",
  deckName: "Cell Biology",
  category: "BIOLOGY",
  front: "What powers ATP synthase?",
  back: "The proton gradient across the inner mitochondrial membrane.",
  explanation: "The electron transport chain pumps protons from the matrix into the intermembrane space, building up a gradient. ATP synthase uses that stored pressure to phosphorylate ADP into ATP as protons flow back through.",
  mnemonic: "ETC charges the battery. ATP synthase uses the battery.",
  cardNumber: 4,
  totalCards: 24,
};

const NAV_ITEMS = ["Features", "Pricing", "About"];

const AVATARS = [
  "https://i.pravatar.cc/40?u=alice",
  "https://i.pravatar.cc/40?u=bob",
  "https://i.pravatar.cc/40?u=carol",
  "https://i.pravatar.cc/40?u=dave",
];

const ForgettingCurve = () => (
  <svg viewBox="0 0 400 140" className="w-full h-auto">
    <defs>
      <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 20 Q60 20 80 50 Q100 80 140 90 Q200 100 300 105 Q380 108 400 108"
      fill="none" stroke="#3A3A4F" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    <path d="M0 20 Q60 18 100 22 Q160 25 220 28 Q300 32 400 35"
      fill="none" stroke="#7C3AED" strokeWidth="2" />
    <path d="M0 140 L0 20 Q60 18 100 22 Q160 25 220 28 Q300 32 400 35 L400 140 Z"
      fill="url(#curveGrad)" opacity="0.15" />
    <text x="320" y="24" fill="#5A5A72" fontSize="9" fontFamily="sans-serif">With AuraMind</text>
    <text x="320" y="98" fill="#3A3A4F" fontSize="9" fontFamily="sans-serif">Without review</text>
  </svg>
);

function FeatureCard({ icon, title, desc, index }: { icon: string; title: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group relative p-5 rounded-xl bg-[#111118] border border-[#2A2A3A] hover:border-[#7C3AED]/30 transition-all duration-300 cursor-default overflow-hidden"
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(124,58,237,0.08), transparent 60%)" }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`); }}
      />
      <motion.div className="text-lg mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</motion.div>
      <h3 className="text-[#F0EFFE] text-sm font-medium mb-1.5">{title}</h3>
      <p className="text-[#5A5A72] text-xs leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #7C3AED, #3B82F6)" }}
    >
      <div className="absolute inset-0 blur-[4px]" style={{ background: "inherit" }} />
    </motion.div>
  );
}

function Spotlight() {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const handleMouse = useCallback((e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY }), []);
  useEffect(() => { window.addEventListener("mousemove", handleMouse); return () => window.removeEventListener("mousemove", handleMouse); }, [handleMouse]);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[55]"
      style={{
        background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(124,58,237,0.07), transparent 60%)`,
        transition: "background 0.1s ease-out",
      }}
    />
  );
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[#2A2A3A]/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-[#F0EFFE] text-sm font-medium tracking-tight">AuraMind</span>
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[#5A5A72] hover:text-[#F0EFFE] text-xs transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/auth")}
            className="text-[#5A5A72] hover:text-[#F0EFFE] text-xs transition-colors"
          >
            Sign in
          </button>
          <MagneticButton
            onClick={() => navigate("/auth")}
            className="px-4 py-1.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
          >
            Start for free
          </MagneticButton>
        </div>
      </div>
    </nav>
  );
};

export default function ModernLandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, 40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0.6]);
  const cardRotateX = useTransform(scrollYProgress, [0, 0.1], [0, 8]);
  const cardRotateY = useTransform(scrollYProgress, [0, 0.1], [0, -5]);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Spotlight />
      <ScrollProgress />
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Hero video — layered behind mesh gradients */}
        <VideoBackground name="hero-neural" opacity={0.5} />

        {/* Mesh gradient hero — 4-blob shifted on 18s loop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite" }}
          />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite 4.5s" }}
          />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite 9s" }}
          />
          <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite 13.5s" }}
          />
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/8 border border-[#7C3AED]/15 text-[#8B5CF6] text-[11px] font-medium mb-6"
            >
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#8B5CF6]">
                <span className="absolute inset-0 rounded-full bg-[#8B5CF6] animate-ping opacity-75" />
              </span>
              Powered by FSRS v5. The science of memory.
            </motion.div>

            <h1 className="text-[#F0EFFE] text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1] tracking-tight mb-4 overflow-hidden">
              {[
                { text: "Learn", cls: "" },
                { text: "anything.", cls: "" },
                { text: "Actually", cls: "font-serif italic bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-[gradient-shift_6s_ease_infinite]" },
                { text: "remember", cls: "" },
                { text: "it.", cls: "" },
              ].map((word, i) => (
                <motion.span
                  key={word.text}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className={`inline-block mr-[0.3em] ${word.cls}`}
                >
                  {word.text}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#5A5A72] text-sm leading-relaxed mb-8 max-w-md"
            >
              AI generates your decks, FSRS schedules your reviews. You just show up.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <MagneticButton
                  onClick={() => navigate("/auth")}
                  className="group relative px-6 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-all duration-300 shadow-[0_0_30px_rgba(124,58,237,0.3)] overflow-hidden"
                >
                  <span className="relative z-10">Start for free →</span>
                  <span
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                      transform: "skewX(-15deg)",
                    }}
                  />
                </MagneticButton>
                <MagneticButton className="px-6 py-2.5 border border-[#2A2A3A] text-[#9090A8] text-sm rounded-lg hover:border-[#3A3A4F] hover:text-[#F0EFFE] transition-all">
                  See how it works
                </MagneticButton>
              </div>

              {/* Avatar stack + learner count */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#2A2A3A]/30">
                <div className="flex -space-x-2">
                  {AVATARS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-[#0A0A0F]"
                      style={{ zIndex: 4 - i }}
                    />
                  ))}
                </div>
                <span className="text-[#5A5A72] text-xs">
                  Join <span className="text-[#F0EFFE] font-medium">1,248</span> learners building knowledge daily
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Card with parallax */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative hidden md:flex justify-center"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="relative"
              style={{ rotateX: cardRotateX, rotateY: cardRotateY }}
            >
              <div className="w-[340px]">
                <Flashcard card={HERO_CARD} showStack float compact={false} />
              </div>
              <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium whitespace-nowrap">
                ✓ Reviewed — see you in 3 days
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Marquee */}
      <section className="border-y border-[#2A2A3A] bg-[#0A0A0F] py-6">
        <Marquee
          items={[
            "AI FLASHCARDS",
            "FSRS v5 SCHEDULING",
            "NEURAL LEARNING",
            "ANKI EXPORT",
            "SPACED REPETITION",
            "MEMORY SCIENCE",
            "TACTILE STUDY",
          ]}
          duration={32}
          className="text-2xl font-medium tracking-tight text-[#9090A8] md:text-3xl"
        />
      </section>

      {/* Manifesto */}
      <ManifestoSection />

      {/* Forgetting Curve — 2-column */}
      <section className="py-20 px-6 border-t border-[#2A2A3A]/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <ForgettingCurve />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#5A5A72] text-[10px] font-medium tracking-[0.2em] uppercase mb-3 block">THE SCIENCE</span>
            <h2 className="text-[#F0EFFE] text-2xl md:text-3xl font-light tracking-tight mb-3">
              Your brain forgets on a <span className="font-serif italic text-[#8B5CF6]">schedule</span>.
            </h2>
            <p className="text-[#5A5A72] text-xs leading-relaxed mb-4">
              AuraMind schedules each card right before you would forget it. You retain more in less time.
            </p>
            <a
              href="https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B5CF6] hover:text-[#7C3AED] text-xs font-medium transition-colors"
            >
              Based on the FSRS algorithm paper →
            </a>
          </motion.div>
        </div>
      </section>

      {/* AI Generation Demo */}
      <AIGenerationDemoSection />

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-[#2A2A3A]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-[#F0EFFE] text-2xl md:text-3xl font-light tracking-tight mb-2">
              Everything you need to actually <span className="font-serif italic text-[#8B5CF6]">learn</span>
            </h2>
            <p className="text-[#5A5A72] text-xs">No fluff. Just the tools that move the needle.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard index={0} icon="A" title="Generate decks instantly" desc="Paste a topic or upload notes. Aura builds a complete deck — definitions, examples, mnemonics." />
            <FeatureCard index={1} icon="S" title="Reviews that actually stick" desc="FSRS v5 schedules each card right before you would forget it. No more cramming." />
            <FeatureCard index={2} icon="H" title="Build a daily habit" desc="5-minute reviews keep your streak alive. Aura nudges you, not annoys you." />
            <FeatureCard index={3} icon="F" title="Flashcards that feel real" desc="Index cards with ruled lines, progress dots, and keyboard shortcuts for speed." />
          </div>
        </div>
      </section>

      {/* Study Mode Preview — horizontal strip */}
      <section className="py-20 px-6 border-t border-[#2A2A3A]/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <span className="text-[#5A5A72] text-[10px] font-medium tracking-[0.2em] uppercase mb-3 block">THE STUDY SESSION</span>
            <h2 className="text-[#F0EFFE] text-2xl md:text-3xl font-light tracking-tight">
              Space to flip.{" "}
              <kbd className="px-2 py-0.5 rounded bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-sm font-mono">1</kbd> again,{" "}
              <kbd className="px-2 py-0.5 rounded bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-sm font-mono">2</kbd> hard,{" "}
              <kbd className="px-2 py-0.5 rounded bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-sm font-mono">3</kbd> good,{" "}
              <kbd className="px-2 py-0.5 rounded bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-sm font-mono">4</kbd> easy.
            </h2>
            <p className="text-[#5A5A72] text-xs mt-3">Full keyboard control. Never touch your mouse during a study session.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="shrink-0"
          >
            <MagneticButton
              onClick={() => navigate("/auth")}
              className="px-5 py-2.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
            >
              Try a study session →
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-[#2A2A3A]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#5A5A72] text-[10px] font-medium tracking-[0.2em] uppercase mb-3 block">Pricing</span>
            <h2 className="text-[#F0EFFE] text-2xl md:text-3xl font-light tracking-tight">
              <span className="font-serif italic text-[#8B5CF6]">Simple</span> pricing
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="p-6 rounded-xl bg-[#111118] border border-[#2A2A3A]"
            >
              <h3 className="text-[#F0EFFE] text-sm font-medium mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold text-[#F0EFFE]">$0</span>
                <span className="text-[#5A5A72] text-xs">forever</span>
              </div>
              <ul className="space-y-2 mb-6">
                {["5 decks", "20 cards per deck", "Basic SRS", "Web access"].map((f, i) => (
                  <li key={i} className="text-[#9090A8] text-xs flex items-center gap-2">
                    <span className="text-[#7C3AED]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <MagneticButton
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 rounded-lg border border-[#2A2A3A] text-[#F0EFFE] text-xs font-medium hover:border-[#7C3AED]/40 transition-all"
              >
                Get Started
              </MagneticButton>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="relative p-6 rounded-xl bg-[#111118] border border-[#7C3AED]/40 overflow-visible"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.12]"
                style={{ background: "radial-gradient(circle, #7C3AED 0%, #3B82F6 50%, transparent 70%)", filter: "blur(40px)" }}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#7C3AED] text-white text-[10px] font-medium rounded-full animate-pulse">
                Most Popular
              </div>
              <h3 className="text-[#F0EFFE] text-sm font-medium mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-semibold text-[#F0EFFE]">$8</span>
                <span className="text-[#5A5A72] text-xs">/month</span>
              </div>
              <p className="text-[10px] text-[#5A5A72] mb-4">or $3.99/mo billed annually ($47.88/yr)</p>
              <ul className="space-y-2 mb-6">
                {["Unlimited decks & cards", "AI deck generation", "Advanced FSRS v5", "Priority support"].map((f, i) => (
                  <li key={i} className="text-[#9090A8] text-xs flex items-center gap-2">
                    <span className="text-[#7C3AED]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <MagneticButton
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] relative z-10"
              >
                Start Free Trial
              </MagneticButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A3A]/30 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center">
              <img src="/favicons,logos/icon-192.svg" alt="AuraMind" className="h-full w-full object-contain" />
            </div>
            <span className="text-[#F0EFFE] text-xs font-medium">AuraMind</span>
          </div>
          <p className="text-[#3A3A4F] text-xs">Built by one person. Powered by real science.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[#5A5A72] hover:text-[#F0EFFE] text-xs transition-colors">Privacy</a>
            <a href="/terms" className="text-[#5A5A72] hover:text-[#F0EFFE] text-xs transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
