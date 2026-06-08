import { motion } from 'framer-motion';
import { ArrowRightIcon as ArrowRight, SparklesIcon as Sparkles, ShieldIcon as Shield, ZapIcon as Zap, TrendingUpIcon as TrendingUp } from '../../components/icons/CustomIcons';
import { useNavigate } from 'react-router-dom';

interface ModernHeroProps {
  className?: string;
}

const ModernHero: React.FC<ModernHeroProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
    },
  };

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            Trusted by 50,000+ Learners
          </span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]">
          <span className="text-foreground">LEARN HALF</span>
          <br />
          <span className="text-primary">THE TIME</span>
          <br />
          <span className="text-zinc-400">REMEMBER MORE</span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          AI flashcards powered by FSRS — the algorithm that maps your forgetting curve. 
          Turn notes, PDFs, and lectures into smart decks. Up to 30% fewer daily reviews.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-black font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all duration-300"
          >
            Start Free — No Credit Card
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-20 flex items-center justify-center gap-8 text-xs text-zinc-500 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Shield size={14} />
            Private
          </span>
          <span className="w-px h-4 bg-zinc-700" />
          <span className="flex items-center gap-2">
            <Zap size={14} />
            Fast
          </span>
          <span className="w-px h-4 bg-zinc-700" />
          <span className="flex items-center gap-2">
            <TrendingUp size={14} />
            98% Retention
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 bg-primary rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export { ModernHero };



