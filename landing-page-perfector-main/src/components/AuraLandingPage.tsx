import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Clock3,
  Zap,
  Cpu,
  Fingerprint,
  Dna,
  ShieldCheck,
  Menu
} from 'lucide-react';
import AuraLogo from './AuraLogo';
import MarqueeSection from './MarqueeSection';
import LoadingScreen from './LoadingScreen';
import FullScreenNav from './FullScreenNav';
import ParallaxSection from './ParallaxSection';
import StatsCounter from './StatsCounter';
import HorizontalScrollGallery from './HorizontalScrollGallery';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import Starfield from './Starfield';
import heroNeuralBg from '@/assets/hero-neural-bg.jpg';

type StudyMode = 'Foundation' | 'Exam' | 'Deep Work';

const protocolV = "V4.8.2";
const heroSignals = ['Active Recall', 'Neural Sync', 'Spaced Repetition', 'Adaptive Decay'];

const features = [
  {
    icon: Cpu,
    tag: 'SYSTEM-01',
    title: 'Neural Decks',
    description: 'Autonomous card generation from raw telemetry. Notes, slides, and transcripts distilled into high-signal memory nodes.'
  },
  {
    icon: Activity,
    tag: 'SYSTEM-02',
    title: 'Insight Matrix',
    description: 'Real-time confidence mapping. Visualize decay patterns and neural drift before they impact performance.'
  },
  {
    icon: Dna,
    tag: 'SYSTEM-03',
    title: 'Biotic Sync',
    description: 'Protocol-driven review cycles that adapt to your cognitive load. Maximum retention with minimum friction.'
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
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<StudyMode>('Foundation');
  const [intensity, setIntensity] = useState(72);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <FullScreenNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="auramind-landing">
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
                <p className="text-[9px] font-bold text-muted-foreground uppercase m-0 mt-1.5 leading-none tracking-[0.2em]">Memory Systems</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-10 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
              <a href="#protocols" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Protocols</a>
              <a href="#science" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Science</a>
              <a href="#features" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Systems</a>
              <a href="#lab" className="hover:text-primary transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">Lab</a>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-protocol py-3 px-6 text-[9px] hidden sm:inline-flex rounded-sm">
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
          <motion.div
            style={{ y: heroImageY, scale: heroImageScale, opacity: heroOpacity }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroNeuralBg}
              alt=""
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          </motion.div>

           <div className="mx-auto max-w-[1920px] w-full relative z-10 overflow-hidden">
             <div className="hero-layout items-end gap-6 lg:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 2.2, ease }}
                className="flex-1"
              >
                <div className="flex items-center gap-4 mb-10">
                  <span className="signal-pill rounded-full">
                    <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                    SYSTEM ONLINE
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{protocolV}</span>
                </div>

                <h1 className="text-impact-hero text-foreground mb-8">
                  REDESIGNING<br />
                  <span className="text-primary/20">HUMAN RECALL.</span>
                </h1>

                <p className="max-w-xl text-base md:text-lg text-muted-foreground mb-12 font-medium leading-relaxed">
                  A high-performance memory protocol for technical minds. Built on neural decay matrices and adaptive spacing algorithms.
                </p>

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
                    GET STARTED
                    <ArrowRight size={16} />
                  </button>
                </form>

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
                className="hidden lg:block lg:w-[320px] xl:w-[400px] flex-shrink-0 relative"
              >
                <div className="glass-card-protocol p-8 scan-line border-t-2 border-t-primary rounded-sm">
                  <div className="flex items-center justify-between mb-10">
                    <p className="text-[10px] font-black tracking-[.3em] text-primary uppercase">Live Diagnostics</p>
                    <Cpu size={18} className="text-muted-foreground/20" />
                  </div>

                  <div className="space-y-6">
                    {[
                      { label: 'Neural Stability', val: '98.4%' },
                      { label: 'Latency', val: '0.12ms' },
                      { label: 'Recall Buffer', val: 'Active' }
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center border-b border-border/50 pb-4">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{item.label}</span>
                        <span className="text-lg font-black italic text-foreground">{item.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-4 bg-background/30 border border-border/50 rounded-sm">
                    <div className="h-10 w-full relative overflow-hidden rounded-sm">
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-0 w-20 bg-primary/10 skew-x-12"
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-[.4em] text-primary/30">
                        SCANNING PATHWAYS
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* MARQUEE */}
        <MarqueeSection />

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
                We leverage the Spacing Effect and Active Recall to convert temporary attention into crystalline knowledge. Built on decades of cognitive research, not guesswork.
              </p>
            </motion.div>
            <StatsCounter />
          </div>
        </ParallaxSection>

        {/* HORIZONTAL SCROLL GALLERY */}
        <HorizontalScrollGallery />

        {/* SUBSYSTEMS GRID */}
        <ParallaxSection id="features" className="landing-section relative z-10" speed={0.08}>
          <div className="mx-auto max-w-7xl">
            <motion.div {...textReveal} className="mb-20">
              <p className="text-eyebrow mb-6">Core Systems</p>
              <h2 className="text-impact-lg text-foreground">THE WORKBENCH.</h2>
            </motion.div>

            <div className="brutalist-grid">
              {features.map((feature, i) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="glass-card-protocol clip-reveal-card p-10 group scan-line rounded-sm"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="h-12 w-12 bg-primary/5 border border-primary/20 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        <feature.icon size={24} />
                      </div>
                      <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[.4em]">{feature.tag}</span>
                    </div>
                    <h3 className="text-2xl font-black italic text-foreground mb-5 uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </ParallaxSection>

        {/* SIMULATION LAB */}
        <ParallaxSection id="lab" className="landing-section bg-background relative z-10 border-t border-border" speed={0.06}>
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div {...textReveal}>
                <p className="text-eyebrow mb-6">Interactive Lab</p>
                <h2 className="text-impact-lg text-foreground mb-10">NEURAL FORECAST.</h2>
                <p className="text-muted-foreground text-base md:text-lg mb-12 leading-relaxed">
                  Calibrate study intensity against neural decay. Observe how AuraMind maintains high stability floors over extended cycles.
                </p>

                <div className="flex flex-wrap gap-3 mb-12">
                  {(Object.keys(modeConfig) as StudyMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-6 py-3 text-[10px] font-black uppercase tracking-[.2em] rounded-sm transition-all duration-300 ${mode === m ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="bg-card border border-border p-8 signal-border rounded-sm">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <label className="text-[10px] font-black text-primary tracking-[.3em] uppercase">Intensity</label>
                      <p className="text-4xl font-black italic text-foreground mt-2">{intensity}%</p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{curve.load}</span>
                  </div>
                  <input
                    type="range" min="30" max="100" value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-1 bg-muted cursor-pointer appearance-none rounded-full"
                    style={{ accentColor: 'hsl(var(--primary))' }}
                  />
                  <p className="mt-6 text-sm text-muted-foreground font-medium italic">{curve.label}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="glass-card-protocol p-4 md:p-8 overflow-hidden rounded-sm"
              >
                <div className="bg-background/50 p-6 border border-border rounded-sm">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[.3em]">Decay Curve</p>
                      <h4 className="text-xl font-black italic text-primary mt-2">Stability: {curve.retention}%</h4>
                    </div>
                    <div className="signal-pill rounded-full text-[8px]">LIVE</div>
                  </div>

                  <div className="relative h-[300px] w-full bg-background/20 border border-border/50 p-6 mb-10 rounded-sm">
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

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Clock3, label: 'Cycle', val: `${curve.intervalHours}h` },
                      { icon: Zap, label: 'Nodes', val: curve.cards },
                      { icon: ShieldCheck, label: 'Floor', val: `${curve.retention}%` }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-card p-4 border border-border rounded-sm">
                        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className="text-lg font-black italic text-foreground">{String(stat.val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </ParallaxSection>

        {/* TESTIMONIALS */}
        <TestimonialsSection />

        {/* FAQ */}
        <FAQSection />

        {/* FINAL CTA */}
        <section className="landing-section bg-primary relative z-10 overflow-hidden">
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
                MASTER YOUR<br />
                MEMORY.
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-foreground text-background px-10 py-5 text-sm font-black uppercase tracking-[.3em] hover:scale-[1.03] transition-transform rounded-sm shadow-xl">
                  START FREE
                </button>
                <button className="border-2 border-primary-foreground/30 text-primary-foreground px-10 py-5 text-sm font-black uppercase tracking-[.3em] hover:border-primary-foreground hover:bg-primary-foreground/5 transition-all rounded-sm">
                  READ DOCS
                </button>
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
              <a href="#" className="hover:text-primary transition-colors duration-300">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors duration-300">Status</a>
              <a href="#" className="hover:text-primary transition-colors duration-300">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default AuraLandingPage;
