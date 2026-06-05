import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TechGridBackground, GridDotPattern } from './TechGridBackground';
import { ModernHero } from './ModernHero';
import { BrutalistFeatures } from './BrutalistFeatures';
import { MinimalStats } from './MinimalStats';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { BoldCTA } from './BoldCTA';
import { motion } from 'framer-motion';
import { ArrowRightIcon as ArrowRight, GithubIcon as Github, TwitterIcon as Twitter } from '../../components/icons/CustomIcons';

const StickyMobileCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs leading-tight">
            <div className="font-bold text-foreground">Study smarter, not longer</div>
            <div className="text-zinc-500">Start free — no credit card</div>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all duration-300"
          >
            Get Started
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="py-12 border-t border-zinc-800 md:pb-12 pb-28">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="text-xl font-black tracking-tight text-foreground mb-2">
              AURAMIND
            </div>
            <p className="text-sm text-zinc-500">
              © 2026 AuraMind. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-zinc-500 hover:text-foreground transition-colors">
              <Twitter size={20} />
            </button>
            <button className="text-zinc-500 hover:text-foreground transition-colors">
              <Github size={20} />
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link to="/download" className="text-zinc-500 hover:text-foreground transition-colors">Download</Link>
            <Link to="/privacy" className="text-zinc-500 hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-zinc-500 hover:text-foreground transition-colors">Terms</Link>
            <button 
              onClick={() => navigate('/auth')}
              className="text-primary hover:text-primary/80 transition-colors font-bold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const ModernLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TechGridBackground />
      <GridDotPattern />
      
      <ModernHero />
      <MinimalStats />
      <BrutalistFeatures />
      <TestimonialsSection />
      <FAQSection />
      <BoldCTA />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default ModernLandingPage;



