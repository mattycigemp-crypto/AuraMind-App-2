import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { animate, createScope } from "animejs";
import { Particles } from "@/components/ui/particles";
import { Meteors } from "@/components/ui/meteors";
import { Ripple } from "@/components/ui/ripple";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { Dock, DockIcon } from "@/components/ui/dock";
import BlurText from "@/components/BlurText";
import ShinyText from "@/components/ShinyText";
import FadeContent from "@/components/FadeContent";
import BentoGrid from "@/components/kokonutui/bento-grid";
import {
  BrainCircuit,
  Sparkles,
  Zap,
  Rocket,
  BookOpen,
  BarChart3,
  Target,
  Trophy,
  Sun,
  Moon,
  Github,
  Twitter,
  HeartHandshake,
} from "@/components/icons";

// ── ANIME.JS CUSTOM HOOK ──────────────────────────────────────
function useAnimeScope() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const scope = createScope({ root: rootRef.current });
    scopeRef.current = scope;

    return () => {
      scope.revert();
    };
  }, []);

  return rootRef;
}

// ── SCROLL PROGRESS ──────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #7C3AED, #3B82F6, #8B5CF6)" }}
    >
      <div className="absolute inset-0 blur-[4px]" style={{ background: "inherit" }} />
    </motion.div>
  );
}

// ── THEME TOGGLE ─────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300"
    >
      {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-purple-400" />}
    </button>
  );
}

// ── CARD COMPONENT ───────────────────────────────────────────
function ShowcaseCard({
  icon,
  title,
  desc,
  gradient = "from-purple-500/10 to-blue-500/10",
  borderColor = "border-purple-500/20",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient?: string;
  borderColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border ${borderColor} p-[1px]`}
    >
      <BorderBeam size={120} duration={8} delay={0} colorFrom="#7C3AED" colorTo="#3B82F6" />
      <div className="relative bg-[#0A0A0F]/90 backdrop-blur-xl rounded-2xl p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5">
            {icon}
          </div>
          <h3 className="text-white font-semibold text-lg tracking-tight">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
        {children}
      </div>
    </motion.div>
  );
}

// ── SECTION HEADER ───────────────────────────────────────────
function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium tracking-wider uppercase mb-4">
        {label}
      </span>
      <TextAnimate
        as="h2"
        animation="blurInUp"
        by="word"
        className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
        duration={0.4}
      >
        {title}
      </TextAnimate>
      <p className="text-gray-500 text-sm max-w-xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}

// ── ANIME.JS DEMO SECTION ────────────────────────────────────
function AnimeJSDemo() {
  const containerRef = useAnimeScope();
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = () => {
    if (!containerRef.current) return;
    setIsAnimating(true);

    // Staggered box animation using anime.js
    animate(".anime-box", {
      translateX: [
        { value: 0, duration: 0 },
        { value: 120, duration: 600, delay: 100 },
        { value: 0, duration: 600, delay: 100 },
      ],
      rotate: [
        { value: 0, duration: 0 },
        { value: 360, duration: 800, ease: "outCubic" },
      ],
      scale: [
        { value: 1, duration: 0 },
        { value: 0.5, duration: 300, delay: 100 },
        { value: 1, duration: 300 },
      ],
      borderRadius: [
        { value: "16px", duration: 0 },
        { value: "50%", duration: 400, delay: 100 },
        { value: "16px", duration: 400 },
      ],
      delay: (_el, i) => (i ?? 0) * 80,
      loop: 1,
    });

    // Animate the counters
    animate(".anime-counter", {
      innerText: [
        { value: 0, duration: 0 },
        { value: 100, duration: 1500, ease: "outExpo" },
      ],
      round: 1,
      delay: 200,
    });

    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <button
        onClick={triggerAnimation}
        disabled={isAnimating}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:from-purple-500 hover:to-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
      >
        {isAnimating ? (
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} />
            Animating...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Rocket size={16} />
            Trigger anime.js Magic
          </span>
        )}
      </button>
      <div className="flex gap-3 flex-wrap">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="anime-box w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="flex gap-4 items-center">
        <span className="anime-counter text-3xl font-bold text-purple-400 tabular-nums">0</span>
        <span className="text-gray-400 text-sm">frames animated</span>
      </div>
      <p className="text-gray-500 text-xs">Powered by anime.js — high-performance JavaScript animation engine</p>
    </div>
  );
}

// ── MOTION.DEMO SECTION ──────────────────────────────────────
function MotionDemo() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1]);

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {[
          { label: "Spring", color: "purple", bg: "rgba(168,85,247,0.2)", border: "rgba(168,85,247,0.2)" },
          { label: "Tween", color: "blue", bg: "rgba(59,130,246,0.2)", border: "rgba(59,130,246,0.2)" },
          { label: "Inertia", color: "emerald", bg: "rgba(16,185,129,0.2)", border: "rgba(16,185,129,0.2)" },
          { label: "Keyframes", color: "amber", bg: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.2)" },
          { label: "Stagger", color: "rose", bg: "rgba(244,63,94,0.2)", border: "rgba(244,63,94,0.2)" },
          { label: "Layout", color: "indigo", bg: "rgba(99,102,241,0.2)", border: "rgba(99,102,241,0.2)" },
        ].map((item) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotate: -10 },
              visible: { opacity: 1, scale: 1, rotate: 0 },
            }}
            whileHover={{ scale: 1.08, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-xl text-center cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${item.bg}, transparent)`,
              borderColor: item.border,
              borderWidth: 1,
            }}
            layout
          >
            <motion.div
              className="w-8 h-8 mx-auto rounded-lg bg-white/10 mb-2"
              animate={{
                y: [0, -8, 0],
                transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            <span className="text-white text-xs font-medium">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
      <motion.div style={{ y, opacity }} className="text-gray-400 text-xs space-y-1">
        <p className="font-medium text-purple-400 text-sm">motion.dev — the successor to Framer Motion</p>
        <p>Spring physics, layout animations, gesture recognition, scroll-linked transforms</p>
      </motion.div>
    </div>
  );
}

// ── REACT BITS TEXT SHOWCASE ─────────────────────────────────
function ReactBitsShowcase() {
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10">
        <p className="text-gray-500 text-xs mb-2 font-mono tracking-wider uppercase">BlurText</p>
        <BlurText
          text="React Bits powers stunning text animations — blur, fade, and slide with precision."
          delay={30}
          animateBy="words"
          direction="top"
          className="text-xl text-white font-light"
        />
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-emerald-500/5 border border-blue-500/10">
        <p className="text-gray-500 text-xs mb-2 font-mono tracking-wider uppercase">ShinyText</p>
        <ShinyText
          text="Experience the shimmer — smooth, continuous gradient animations."
          speed={3}
          shineColor="#8B5CF6"
          color="#9090A8"
          className="text-xl font-light"
        />
      </div>

      <FadeContent blur duration={800} threshold={0.2}>
        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-purple-500/5 border border-emerald-500/10">
          <p className="text-gray-500 text-xs mb-2 font-mono tracking-wider uppercase">FadeContent + ScrollReveal</p>
          <p className="text-white text-sm">
            Elements fade into view on scroll with customizable blur, duration, and easing.
            Built on GSAP ScrollTrigger for silky-smooth performance.
          </p>
        </div>
      </FadeContent>
    </div>
  );
}

// ── MAGIC UI SHOWCASE ────────────────────────────────────────
function MagicUIShowcase() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-8">
        <div className="relative z-10">
          <TextAnimate
            as="h3"
            animation="blurInUp"
            by="word"
            className="text-2xl font-bold text-white mb-3"
            duration={0.3}
          >
            Magic UI Components
          </TextAnimate>
          <p className="text-gray-400 text-sm mb-4">
            9 components installed — particles, dock, shine-border, animated-beam, border-beam,
            text-animate, meteors, ripple, animated-grid-pattern
          </p>
        </div>
        <AnimatedGridPattern
          numSquares={20}
          maxOpacity={0.1}
          duration={3}
          className="fill-purple-500/10 stroke-purple-500/10"
        />
      </div>

      {/* Dock Preview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 p-4">
        <p className="text-gray-500 text-xs mb-2 font-mono tracking-wider uppercase">Dock — macOS-style</p>
        <Dock direction="middle" className="bg-white/5 backdrop-blur-xl border-white/10">
          <DockIcon className="bg-black/40 hover:bg-purple-500/20 transition-colors cursor-pointer">
            <BrainCircuit size={18} className="text-purple-400" />
          </DockIcon>
          <DockIcon className="bg-black/40 hover:bg-blue-500/20 transition-colors cursor-pointer">
            <Sparkles size={18} className="text-blue-400" />
          </DockIcon>
          <DockIcon className="bg-black/40 hover:bg-emerald-500/20 transition-colors cursor-pointer">
            <Zap size={18} className="text-emerald-400" />
          </DockIcon>
          <DockIcon className="bg-black/40 hover:bg-amber-500/20 transition-colors cursor-pointer">
            <Rocket size={18} className="text-amber-400" />
          </DockIcon>
          <DockIcon className="bg-black/40 hover:bg-rose-500/20 transition-colors cursor-pointer">
            <HeartHandshake size={18} className="text-rose-400" />
          </DockIcon>
        </Dock>
      </div>

      {/* Shine Border + BorderBeam */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 to-rose-500/5 border border-amber-500/20 p-6">
          <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} borderWidth={1} duration={8} />
          <p className="text-white font-medium text-sm mb-1">Shine Border</p>
          <p className="text-gray-400 text-xs">An animated gradient border that sweeps across the edge</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 p-6">
          <BorderBeam size={80} duration={6} colorFrom="#10B981" colorTo="#3B82F6" />
          <p className="text-white font-medium text-sm mb-1">Border Beam</p>
          <p className="text-gray-400 text-xs">A sweeping beam of light tracing the border contour</p>
        </div>
      </div>
    </div>
  );
}

// ── KOKONUT UI ADAPTED ───────────────────────────────────────
function KokonutUIShowcase() {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-xs mb-1">
        Kokonut UI — 100+ components built with Tailwind CSS, shadcn/ui, and Motion.
        Installed: BentoGrid with 3D tilt cards, AI partner logos, typing animation, and voice UI.
      </p>
      <div className="scale-[0.85] origin-top -mx-8">
        <BentoGrid />
      </div>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────
export default function IntegrationShowcase() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Libraries", icon: Sparkles },
    { id: "magicui", label: "Magic UI", icon: Zap },
    { id: "reactbits", label: "React Bits", icon: BrainCircuit },
    { id: "kokonut", label: "Kokonut UI", icon: BookOpen },
    { id: "anime", label: "anime.js", icon: Target },
    { id: "motion", label: "Motion", icon: Rocket },
  ];

  const filteredSections = useMemo(() => {
    if (activeTab === "all") return ["hero", "magicui", "reactbits", "kokonut", "anime", "motion"];
    const map: Record<string, string[]> = {
      magicui: ["hero", "magicui", "stats"],
      reactbits: ["hero", "reactbits"],
      kokonut: ["kokonut"],
      anime: ["anime"],
      motion: ["motion", "stats"],
    };
    return map[activeTab] || ["hero"];
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <ScrollProgressBar />
      <ThemeToggle />

      {/* ── AMBIENT BG — Meteors + Grid Pattern ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.03}
          duration={4}
          className="fill-purple-500/10 stroke-purple-500/10"
        />
        <Particles quantity={80} color="#8B5CF6" size={0.4} staticity={30} className="opacity-30" />
        <Meteors number={15} minDelay={1} maxDelay={4} minDuration={3} maxDuration={8} angle={215} />
      </div>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <Ripple mainCircleSize={180} mainCircleOpacity={0.08} numCircles={6} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-2xl opacity-30" />
          <div className="relative px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
            <TextAnimate
              as="span"
              animation="blurInUp"
              by="character"
              className="text-sm font-mono text-purple-400 tracking-widest"
              duration={0.05}
            >
              6 LIBRARIES · 1 SHOWCASE
            </TextAnimate>
          </div>
        </motion.div>

        <BlurText
          text="AuraMind Integration Showcase"
          delay={50}
          animateBy="words"
          direction="top"
          className="text-5xl md:text-7xl font-bold text-center mb-6 max-w-4xl"
        />

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {[
            "Kokonut UI",
            "React Bits",
            "Magic UI",
            "anime.js",
            "Motion",
          ].map((lib) => (
            <motion.span
              key={lib}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + tabs.findIndex((t) => t.label.includes(lib.split(" ")[0])) * 0.08 }}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium"
            >
              {lib}
            </motion.span>
          ))}
        </div>

        <p className="text-gray-500 text-sm text-center max-w-lg mb-8">
          A comprehensive integration of six modern UI and animation libraries,
          demonstrating seamless coexistence in a single React application.
        </p>

        {/* Stat counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-8 md:gap-12"
        >
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              15+
            </div>
            <div className="text-gray-500 text-xs mt-1">Components</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              6
            </div>
            <div className="text-gray-500 text-xs mt-1">Libraries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              4
            </div>
            <div className="text-gray-500 text-xs mt-1">CLI Registries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              100%
            </div>
            <div className="text-gray-500 text-xs mt-1">TypeScript</div>
          </div>
        </motion.div>
      </section>

      {/* ── TAB NAV ── */}
      <div className="sticky top-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto gap-1 py-3 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Magic UI Section */}
            {(filteredSections.includes("magicui") || activeTab === "all") && (
              <section className="py-16">
                <SectionHeader
                  label="Magic UI"
                  title="Animated Components from Magic UI"
                  subtitle="9 components added via shadcn CLI from magicui.design registry"
                />
                <MagicUIShowcase />
              </section>
            )}

            {/* React Bits Section */}
            {(filteredSections.includes("reactbits") || activeTab === "all") && (
              <section className="py-16 border-t border-white/5">
                <SectionHeader
                  label="React Bits"
                  title="Animated Text & Scroll Effects"
                  subtitle="5 components added: BlurText, SplitText, ScrollReveal, FadeContent, ShinyText"
                />
                <ReactBitsShowcase />
              </section>
            )}

            {/* Kokonut UI Section */}
            {(filteredSections.includes("kokonut") || activeTab === "all") && (
              <section className="py-16 border-t border-white/5">
                <SectionHeader
                  label="Kokonut UI"
                  title="Bento Grid with 3D Tilt"
                  subtitle="BentoGrid component with 3D perspective, spotlight effects, timeline, and AI partner logos"
                />
                <KokonutUIShowcase />
              </section>
            )}

            {/* anime.js Section */}
            {(filteredSections.includes("anime") || activeTab === "all") && (
              <section className="py-16 border-t border-white/5">
                <SectionHeader
                  label="anime.js"
                  title="High-Performance Custom Animations"
                  subtitle="anime.js v4 with createScope for memory-safe, component-scoped animations"
                />
                <ShowcaseCard
                  icon={<Target size={20} className="text-rose-400" />}
                  title="anime.js v4 — createScope API"
                  desc="Component-scoped animations with automatic cleanup. No memory leaks, no global state."
                  gradient="from-rose-500/10 to-orange-500/10"
                  borderColor="border-rose-500/20"
                >
                  <AnimeJSDemo />
                </ShowcaseCard>
              </section>
            )}

            {/* Motion Section */}
            {(filteredSections.includes("motion") || activeTab === "all") && (
              <section className="py-16 border-t border-white/5">
                <SectionHeader
                  label="Motion"
                  title="The Successor to Framer Motion"
                  subtitle="motion.dev — spring physics, layout animations, gesture support at 120fps"
                />
                <ShowcaseCard
                  icon={<Rocket size={20} className="text-blue-400" />}
                  title="Motion — motion/react"
                  desc="Full framer-motion API compatibility plus new features. Already installed and powering all animations on this page."
                  gradient="from-blue-500/10 to-purple-500/10"
                  borderColor="border-blue-500/20"
                >
                  <MotionDemo />
                </ShowcaseCard>
              </section>
            )}

            {/* Stats Section */}
            {(filteredSections.includes("stats") || activeTab === "all") && (
              <section className="py-16 border-t border-white/5">
                <SectionHeader
                  label="Integration Stats"
                  title="Everything works together"
                  subtitle="Zero conflicts between libraries — all 6 coexist peacefully"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShowcaseCard
                    icon={<BarChart3 size={20} className="text-emerald-400" />}
                    title="Installed Components"
                    desc="15+ components spanning bento grids, particles, text effects, docks, animated borders, and custom animations."
                    gradient="from-emerald-500/10 to-teal-500/10"
                    borderColor="border-emerald-500/20"
                  />
                  <ShowcaseCard
                    icon={<Trophy size={20} className="text-amber-400" />}
                    title="Library Versions"
                    desc="animejs (9.2+), motion (12.x +), Kokonut UI (latest), React Bits (latest), Magic UI (latest)"
                    gradient="from-amber-500/10 to-orange-500/10"
                    borderColor="border-amber-500/20"
                  />
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuit size={20} className="text-purple-400" />
            <span className="text-white text-sm font-medium">AuraMind</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            Integration Showcase — All 6 libraries installed via npm and shadcn CLI
          </p>
          <div className="flex items-center gap-4">
            <Github size={16} className="text-gray-500 hover:text-purple-400 cursor-pointer transition-colors" />
            <Twitter size={16} className="text-gray-500 hover:text-purple-400 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
