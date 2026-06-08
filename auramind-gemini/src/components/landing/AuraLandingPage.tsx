import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ActivityIcon as Activity,
  ArrowRightIcon as ArrowRight,
  Clock3Icon as Clock3,
  ZapIcon as Zap,
  CpuIcon as Cpu,
  FingerprintIcon as Fingerprint,
  DnaIcon as Dna,
  ShieldCheckIcon as ShieldCheck,
  MenuIcon as Menu,
  BotIcon as Bot,
  SparklesIcon as Sparkles,
  SunIcon as Sun,
  MoonIcon as Moon,
  CheckCircle2Icon as CheckCircle2,
  FileTextIcon as FileText,
  ScanSearchIcon as ScanSearch,
  Mic2Icon as Mic2,
  LockKeyholeIcon as LockKeyhole,
  GraduationCapIcon as GraduationCap,
  BrainIcon as Brain,
  TargetIcon as Target,
  TrendingUpIcon as TrendingUp,
  UsersIcon as Users,
  BookOpenIcon as BookOpen,
  LightbulbIcon as Lightbulb
} from '../../components/icons/CustomIcons';
import { useTheme } from '../../hooks/useTheme';
import AuraLogo from './AuraLogo';
import MarqueeSection from './MarqueeSection';
import LoadingScreen from '../shared/LoadingScreen';
import FullScreenNav from '../shared/FullScreenNav';
import ParallaxSection from './ParallaxSection';
import StatsCounter from '../shared/StatsCounter';
import HorizontalScrollGallery from '../shared/HorizontalScrollGallery';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import Starfield from './Starfield';
import SmoothScroll from '../shared/SmoothScroll';
import FloatingParticles from './FloatingParticles';
import { AnimatedSection, useParallax } from './ScrollAnimations';
import { GlowCard, TiltCard } from './MicroInteractions';
import { StunningCard } from './StunningFeatureCard';
import { AnimatedNumber, StatItem, CounterCircle } from './AnimatedStats';
import { TextReveal } from './EnhancedHero';
import heroNeuralBg from '@/assets/hero-neural-bg.jpg';
import { TechGridBackground, GridDotPattern } from './TechGridBackground';
import { ModernHero } from './ModernHero';
import { BrutalistFeatures } from './BrutalistFeatures';
import { MinimalStats } from './MinimalStats';
import { BoldCTA } from './BoldCTA';

type StudyMode = 'Foundation' | 'Exam' | 'Deep Work';

const protocolV = "V4.8.2";
const heroSignals = ['Built for every learner and subject', 'Source-anchored flashcards', 'Weak-spot detection', 'Adaptive review flow'];
const proofCards = [
  {
    title: 'Flashcard Builder',
    eyebrow: 'Source to deck',
    detail: 'Turn lecture notes, outlines, and PDFs into clean active-recall cards in seconds.',
    icon: FileText,
  },
  {
    title: 'Weak-Spot Analysis',
    eyebrow: 'Find the misses',
    detail: 'See which topics are decaying fastest before they become exam-day failures.',
    icon: ScanSearch,
  },
  {
    title: 'Review Flow',
    eyebrow: 'Daily execution',
    detail: 'Work through due cards, hear answers aloud, and move into the next review block automatically.',
    icon: Mic2,
  },
];

const trustSignals = [
  'Private study workspace. We do not sell your data.',
  'Export or delete decks whenever you want.',
  'Built for serious learning, not meditation or journaling.',
  'Transparent review logic with visible source context.',
];

const features = [
  {
    icon: Cpu,
    tag: 'SYSTEM-01',
    title: 'Source-Anchored Flashcards',
    description: 'Generate cards from lecture notes, outlines, transcripts, and pasted study guides with visible source context.'
  },
  {
    icon: Activity,
    tag: 'SYSTEM-02',
    title: 'Weak-Spot Analysis',
    description: 'See which concepts are slipping, which decks are strongest, and which review blocks matter most today.'
  },
  {
    icon: Dna,
    tag: 'SYSTEM-03',
    title: 'Adaptive Review Flow',
    description: 'Study in a guided flow that adjusts timing and pressure for exams, certifications, and any high-stakes learning goals.'
  }
];

const modeConfig: Record<StudyMode, { label: string; decay: number; interval: number; load: string }> = {
  Foundation: { label: 'Balanced reinforcement for daily study blocks.', decay: 0.9, interval: 18, load: 'Standard Load' },
  Exam: { label: 'Aggressive review cadence for short-term performance.', decay: 0.76, interval: 12, load: 'Critical Intensity' },
  'Deep Work': { label: 'Longer, calmer sessions designed for durable understanding.', decay: 1.06, interval: 24, load: 'Deep Efficiency' },
};

const ease: [number, number, number, number] = [0.65, 0.05, 0, 1];

const textReveal = {
  initial: { opacity: 0, y: 30, skewY: 2 },
  whileInView: { opacity: 1, y: 0, skewY: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease }
};

const buildCurvePath = (points: number[], width: number, height: number) => {
  const maxY = height - 20;
  const minY = 20;
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = maxY - ((point - 10) / 90) * (maxY - minY);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
};

const AuraLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<StudyMode>('Foundation');
  const [intensity, setIntensity] = useState(72);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroScrollProgress, [0, 1], ['0%', '30%']);
  const heroImageScale = useTransform(heroScrollProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const curve = useMemo(() => {
    const profile = modeConfig[mode];
    const checkpoints = [0, 1, 2, 4, 7, 10, 14];
    const firstDrop = 12 + (100 - intensity) * 0.3;
    const boost = intensity * 0.25;

    const points = checkpoints.map((day, index) => {
      if (index === 0) return 100;
      const decayValue = 100 - firstDrop - day * (5 / profile.decay) + boost;
      const bias = mode === 'Exam' ? day * 0.6 : day * 0.9;
      return Math.min(100, Math.max(22, Math.round(decayValue - bias)));
    });

    return {
      path: buildCurvePath(points, 600, 300),
      points,
      retention: Math.round(points[points.length - 1] + intensity * 0.1),
      intervalHours: Math.round(profile.interval + intensity * 0.2),
      cards: Math.round(20 + intensity * 0.3),
      load: profile.load,
      label: profile.label,
    };
  }, [intensity, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth', { state: { email } });
  };

  return (
    <SmoothScroll>
      <div className="auramind-landing landing-page">
        <AnimatePresence>
          {loading && <LoadingScreen />}
        </AnimatePresence>

        <FullScreenNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="neural-grid" />

        {/* BACKGROUND EFFECTS — shifted to warmer tones */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute left-[-10%] top-[10%] h-[90vh] w-[50vw] rounded-full bg-primary/[0.03] blur-[250px]" />
          <div className="absolute right-[-5%] bottom-[10%] h-[70vh] w-[35vw] rounded-full bg-accent/[0.04] blur-[200px]" />
        </div>

        {/* TOP NAVIGATION */}
        <nav className={`fixed inset-x-0 top-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-border shadow-2xl shadow-background/50' : 'bg-transparent'}`}>
          <div className="navbar-container">
            <a href="#" className="flex items-center gap-3 group">
              <AuraLogo size={36} className="group-hover:scale-110 transition-transform duration-500" />
              <div className="hidden lg:block">
                <p className="text-[11px] font-black tracking-[0.35em] text-foreground uppercase m-0 leading-none">AuraMind</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase m-0 mt-1.5 leading-none tracking-[0.2em]">Study App</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-10 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
              <a href="#protocols" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">How It Works</a>
              <a href="#science" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Science</a>
              <a href="#features" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Features</a>
              <a href="#lab" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Demo</a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="h-10 w-10 border border-border rounded-sm flex items-center justify-center text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="btn-protocol py-3 px-6 text-[9px] hidden sm:inline-flex rounded-sm"
              >
                Get Access
              </button>
              <button
                onClick={() => setMenuOpen(true)}
                className="h-10 w-10 border border-border rounded-sm flex items-center justify-center text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header ref={heroRef} className="hero-fullscreen relative z-10 px-6 overflow-hidden">
          <Starfield />
          <FloatingParticles particleCount={40} />
          <motion.div
            style={{ y: heroImageY, scale: heroImageScale, opacity: heroOpacity }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroNeuralBg}
              alt=""
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
          </motion.div>

           <div className="hero-shell mx-auto max-w-[1920px] w-full relative z-10">
             <div className="hero-layout gap-6 lg:gap-8 lg:items-end">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 2.2, ease }}
                className="hero-copy min-w-0"
              >
                <div className="hero-kicker-row mb-10">
                  <span className="signal-pill rounded-full">
                    <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                    SMART LEARNING SYSTEM
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                    <GraduationCap size={12} />
                    FOR EVERY LEARNER
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{protocolV}</span>
                </div>

                <h1 className="text-impact-hero text-foreground mb-8">
                  REMEMBER EVERYTHING<br />
                  <span className="text-primary">WITH THE POWER OF AI.</span>
                </h1>

                <p className="max-w-xl text-base md:text-lg text-muted-foreground mb-12 font-medium leading-relaxed">
                  AuraMind is a smart learning app for students, professionals, and lifelong learners who need faster recall and deeper understanding. Build source-backed flashcards, spot weak topics early, and follow a review flow designed for retention, not busywork.
                </p>

                <div className="mb-10 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Outcome', value: 'Reach first review in under 5 minutes' },
                    { label: 'Trust', value: 'See citations attached to each card' },
                    { label: 'Focus', value: 'Know exactly what to review next' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-sm border border-border bg-card/60 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">{item.label}</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mb-12">
                  <div className="flex-1 relative bg-card border border-border rounded-sm overflow-hidden">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-transparent px-6 py-4 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/20">
                      <Fingerprint size={18} />
                    </div>
                  </div>
                  <button type="submit" className="btn-protocol px-8 py-4 rounded-sm">
                    START STUDYING FREE
                    <ArrowRight size={16} />
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-4 mb-12 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-primary" /> Private workspace</span>
                  <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> No data sold</span>
                  <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Built for learning, not wellness</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {heroSignals.map((signal, i) => (
                    <motion.div
                      key={signal}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.6 + i * 0.1 }}
                      className="flex items-center gap-2 text-[9px] font-black tracking-widest text-muted-foreground/60 uppercase border border-border/50 px-3 py-1.5 rounded-full"
                    >
                      <div className="h-1 w-1 bg-primary rounded-full" />
                      {signal}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 2.5 }}
                className="hero-sidecard relative"
              >
                <div className="glass-card-protocol p-8 scan-line border-t-2 border-t-primary rounded-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black tracking-[.3em] text-primary uppercase">Live Product Preview</p>
                    <Cpu size={18} className="text-muted-foreground/20" />
                  </div>

                  <div className="rounded-sm border border-border bg-background/40 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-primary">Card</p>
                      <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Weak spot: Civil Procedure</span>
                    </div>
                    <p className="text-sm font-black text-foreground leading-relaxed">What standard does a court apply when deciding a Rule 12(b)(6) motion?</p>
                    <div className="mt-4 rounded-sm border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Citation</p>
                      <p className="mt-2 text-xs text-muted-foreground">Federal Rules of Civil Procedure, Rule 12(b)(6) and Twombly / Iqbal pleading standard.</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-sm border border-border bg-background/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Weak-spot analysis</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-primary">72% decay risk</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[72%] bg-primary" />
                      </div>
                    </div>
                    <div className="rounded-sm border border-border bg-background/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Next review flow</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-foreground">12 cards due</span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Priority deck, reveal answer, rate recall, and move directly into the next high-risk concept.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* MARQUEE */}
        <MarqueeSection />

        <ParallaxSection id="protocols" className="landing-section relative z-10 border-y border-border bg-card/20" speed={0.07}>
          <div className="mx-auto max-w-7xl">
            <motion.div {...textReveal} className="mb-16">
              <p className="text-eyebrow mb-6">Who It Is For</p>
              <h2 className="text-impact-lg text-foreground">
                BUILT FOR STUDENTS WITH<br />
                <span className="text-primary">TOO MUCH TO REMEMBER.</span>
              </h2>
              <p className="mt-8 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                AuraMind is for students, professionals, and lifelong learners tackling any challenging subject. If your material is dense, your deadlines are real, and forgetting details is expensive, this is the workflow we built for.
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {proofCards.map((card) => (
                <div key={card.title} className="glass-card-protocol rounded-sm p-8">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">{card.eyebrow}</span>
                    <card.icon size={18} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase text-foreground">{card.title}</h3>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed font-medium">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </ParallaxSection>

        {/* SCIENCE SECTION */}
        <ParallaxSection id="science" className="landing-section relative z-10 border-y border-border bg-card/30" speed={0.1}>
          <div className="mx-auto max-w-5xl text-center">
            <motion.div {...textReveal}>
              <p className="text-eyebrow mb-8">The Science</p>
              <h2 className="text-impact-xl text-foreground mb-12">
                ENGINEERED<br />
                <span className="text-primary">FOR BIOLOGY.</span>
              </h2>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                We use proven study methods like spaced repetition and active recall to help you remember more over time.
              </p>
            </motion.div>
            <StatsCounter />
          </div>
        </ParallaxSection>

        {/* ENHANCED STATS SECTION */}
        <section className="relative z-10 border-y border-border bg-card/20 py-20 overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <div className="mx-auto max-w-7xl relative z-10 px-6">
            <AnimatedSection animation="fade-up" className="text-center mb-16">
              <p className="text-eyebrow mb-4">By The Numbers</p>
              <h2 className="text-impact-lg text-foreground">
                PROVEN RESULTS<br />
                <span className="text-primary">THAT SPEAK FOR THEMSELVES.</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedSection animation="scale-up" delay={0.1}>
                <StatItem value={94} suffix="%" label="Retention Rate" />
              </AnimatedSection>
              <AnimatedSection animation="scale-up" delay={0.2}>
                <StatItem value={3} suffix="x" label="Faster Learning" />
              </AnimatedSection>
              <AnimatedSection animation="scale-up" delay={0.3}>
                <StatItem value={89} suffix="%" label="User Satisfaction" />
              </AnimatedSection>
              <AnimatedSection animation="scale-up" delay={0.4}>
                <StatItem value={2} suffix="M+" label="Cards Created" />
              </AnimatedSection>
            </div>

            <AnimatedSection animation="fade-up" delay={0.5} className="mt-16">
              <div className="flex flex-wrap justify-center gap-8">
                <CounterCircle value={85} label="Active Users" color="#a855f7" />
                <CounterCircle value={72} label="Exam Pass Rate" color="#9333ea" />
                <CounterCircle value={91} label="Weekly Retention" color="#7c3aed" />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* HORIZONTAL SCROLL GALLERY */}
        <HorizontalScrollGallery />

        {/* AI POSITIONING */}
        <ParallaxSection className="landing-section relative z-10 border-y border-border bg-background/60" speed={0.09}>
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="glass-card-protocol rounded-sm p-8 md:p-10">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                  <Sparkles size={14} />
                  How AI Helps
                </div>
                <h2 className="text-impact-lg text-foreground mb-6">
                  AI THAT HELPS YOU<br />
                  <span className="text-primary">STUDY FOR THE TEST IN FRONT OF YOU.</span>
                </h2>
                <p className="max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  AuraMind uses AI to compress messy source material into usable cards, prioritize what you are forgetting, and keep review moving. It is not a generic “mindfulness” or “brain wellness” app. It is a focused study workflow for high-pressure recall.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  'Generate cards from messy notes, lectures, and PDFs.',
                  'Get adaptive study guidance based on retention patterns.',
                  'Use visible citations so learners can trust what they review.'
                ].map((item) => (
                  <div key={item} className="glass-card-protocol rounded-sm p-6">
                    <div className="mb-3 flex items-center gap-3 text-primary">
                      <Bot size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Feature</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </ParallaxSection>

        {/* FEATURES GRID */}
        <ParallaxSection id="features" className="landing-section relative z-10" speed={0.08}>
          <div className="mx-auto max-w-7xl">
            <motion.div {...textReveal} className="mb-20">
              <p className="text-eyebrow mb-6">Core Features</p>
              <h2 className="text-impact-lg text-foreground">WHAT YOU GET.</h2>
            </motion.div>

            <div className="brutalist-grid">
              {features.map((feature, i) => (
                <StunningCard
                  key={feature.title}
                  icon={<feature.icon size={24} />}
                  title={feature.title}
                  description={feature.description}
                  tag={feature.tag}
                  delay={i * 0.15}
                />
              ))}
            </div>
          </div>
        </ParallaxSection>

        {/* SIMULATION LAB */}
        <ParallaxSection id="lab" className="landing-section bg-background relative z-10 border-t border-border" speed={0.06}>
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <motion.div {...textReveal}>
                <p className="text-eyebrow mb-6">Product Demo</p>
                <h2 className="text-impact-lg text-foreground mb-10">SEE THE REVIEW FLOW.</h2>
                <p className="text-muted-foreground text-base md:text-lg mb-12 leading-relaxed">
                  The live preview below shows the three moments that matter most: card creation, weak-spot detection, and the actual review loop that keeps recall moving forward.
                </p>

                <div className="grid gap-4">
                  {[
                    '1. Paste your notes or upload a lecture PDF.',
                    '2. AuraMind creates source-backed flashcards and tags weak spots.',
                    '3. Review only what is due, rate recall, and let the schedule update automatically.',
                  ].map((step) => (
                    <div key={step} className="rounded-sm border border-border bg-card p-5 text-sm font-medium text-muted-foreground">
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="glass-card-protocol p-4 md:p-8 overflow-hidden rounded-sm"
              >
                <div className="bg-background/50 p-6 border border-border rounded-sm space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[.3em]">Review Intelligence</p>
                      <h4 className="text-xl font-black italic text-primary mt-2">Exam Mode Live</h4>
                    </div>
                    <div className="signal-pill rounded-full text-[8px]">LIVE</div>
                  </div>

                  <div className="rounded-sm border border-border/50 bg-background/20 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Weak-spot analysis</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-primary">Contracts: 68% risk</span>
                    </div>
                    <div className="relative mt-5 h-[170px] w-full">
                      <svg viewBox="0 0 600 300" className="w-full h-full overflow-visible">
                      {[0, 1, 2, 3].map(i => (
                        <line key={i} x1="0" y1={i * 80 + 30} x2="600" y2={i * 80 + 30} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />
                      ))}
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        d={curve.path}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {curve.points.map((p, i) => (
                        <circle key={i} cx={(i / 6) * 600} cy={280 - ((p - 10) / 90) * 260} r="4" fill="hsl(var(--primary))" />
                      ))}
                    </svg>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-sm border border-border bg-card p-5">
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-3">Flashcard screenshot</p>
                      <p className="text-sm font-black text-foreground">What is photosynthesis and why is it important?</p>
                      <div className="mt-4 rounded-sm border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                        Source: Lecture 4 outline, section 2.2
                      </div>
                    </div>
                    <div className="rounded-sm border border-border bg-card p-5">
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-3">Review flow screenshot</p>
                      <p className="text-sm text-muted-foreground">12 cards due now, 4 cards high risk, next session in {curve.intervalHours} hours.</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-[0.18em]">
                        {['Again', 'Good', 'Easy'].map((label) => (
                          <div key={label} className="border border-border px-2 py-3">{label}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </ParallaxSection>

        {/* TESTIMONIALS */}
        <TestimonialsSection />

        <ParallaxSection className="landing-section relative z-10 border-t border-border bg-card/20" speed={0.05}>
          <div className="mx-auto max-w-7xl">
            <motion.div {...textReveal} className="mb-14">
              <p className="text-eyebrow mb-6">Trust and Privacy</p>
              <h2 className="text-impact-lg text-foreground">
                CLEARER REASONS TO<br />
                <span className="text-primary">TRUST THE WORKFLOW.</span>
              </h2>
            </motion.div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-card-protocol rounded-sm p-8">
                <div className="mb-4 inline-flex items-center gap-3 text-primary">
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.28em]">Privacy posture</span>
                </div>
                <div className="space-y-4">
                  {trustSignals.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card-protocol rounded-sm p-8">
                <div className="mb-4 inline-flex items-center gap-3 text-primary">
                  <Fingerprint size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.28em]">Brand clarity</span>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed font-medium">
                  AuraMind is the learning-focused product in this category. We are not a meditation app, mood tracker, or general “mindfulness” tool. The product is designed around recall, review scheduling, flashcards, citations, and effective learning.
                </p>
                <div className="mt-6 rounded-sm border border-border bg-background/40 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">Best fit</p>
                  <p className="mt-3 text-sm text-foreground font-medium">Students, professionals, and lifelong learners who need to retain dense material fast.</p>
                </div>
              </div>
            </div>
          </div>
        </ParallaxSection>

        {/* FAQ */}
        <FAQSection />

        {/* FINAL CTA */}
        <section className="landing-section bg-background relative z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary-foreground)) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }} />
          </div>
          <div className="mx-auto max-w-5xl py-20 text-center relative z-10">
            <motion.div {...textReveal}>
              <p className="text-[10px] font-black text-primary-foreground/60 tracking-[.5em] uppercase mb-10">Ready to begin?</p>
              <h2 className="text-impact-xl text-primary-foreground mb-14 leading-[.85]">
                START WITH YOUR NEXT<br />
                REVIEW BLOCK.
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-base md:text-lg text-primary-foreground/75 leading-relaxed font-medium">
                Create your first source-backed deck, see your weak spots, and start reviewing in minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => navigate('/auth')} className="bg-foreground text-background px-10 py-5 text-sm font-black uppercase tracking-[.3em] hover:scale-[1.03] transition-transform rounded-sm shadow-xl">
                  START FREE STUDY SESSION
                </button>
                <a href="#lab" className="border-2 border-primary-foreground/30 text-primary-foreground px-10 py-5 text-sm font-black uppercase tracking-[.3em] hover:border-primary-foreground hover:bg-primary-foreground/5 transition-all rounded-sm">
                  VIEW DEMO FLOW
                </a>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
                <span>Privacy-first study data</span>
                <span>Built for learning</span>
                <span>Source-backed flashcards</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="landing-section bg-background text-muted-foreground relative z-10 pt-8 pb-16">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10 border-t border-border pt-16">
            <div className="flex items-center gap-3">
              <AuraLogo size={28} />
              <p className="text-[10px] font-black tracking-[.4em] uppercase m-0 leading-none">AURAMIND © 2025</p>
            </div>
            <div className="flex gap-10 text-[10px] font-black tracking-widest uppercase">
              <Link to="/privacy" className="hover:text-primary transition-colors duration-300">Privacy</Link>
              <Link to="/docs" className="hover:text-primary transition-colors duration-300">Docs</Link>
              <Link to="/terms" className="hover:text-primary transition-colors duration-300">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
};

export default AuraLandingPage;



