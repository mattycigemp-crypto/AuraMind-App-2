import { motion } from 'framer-motion';
import { BrainIcon as Brain, FileTextIcon as FileText, TargetIcon as Target, ZapIcon as Zap, ArrowRightIcon as ArrowRight, BarChart3Icon as BarChart3 } from '../../components/icons/CustomIcons';

interface BrutalistFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}

const features: BrutalistFeature[] = [
  {
    icon: <FileText size={28} />,
    title: 'SOURCE TO DECK',
    description: 'Turn notes, PDFs, lectures into flashcards instantly. Every card links back to its source.',
    tag: 'GENERATE',
  },
  {
    icon: <Target size={28} />,
    title: 'WEAK-SPOT DETECTION',
    description: 'See what you are forgetting before the exam. Focus on what actually matters.',
    tag: 'ANALYZE',
  },
  {
    icon: <Brain size={28} />,
    title: 'FSRS ADAPTIVE REVIEW',
    description: 'The same ML-based algorithm used by Anki power users. Models your personal forgetting curve for up to 30% fewer daily reviews.',
    tag: 'OPTIMIZE',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'RETENTION TRACKING',
    description: 'Track mastery across every topic. Know exactly where you stand.',
    tag: 'MEASURE',
  },
  {
    icon: <Zap size={28} />,
    title: 'AI ASSISTANT',
    description: 'Chat with AI to explain concepts, generate questions, or fill knowledge gaps.',
    tag: 'ENHANCE',
  },
  {
    icon: <Brain size={28} />,
    title: 'MULTI-MODAL',
    description: 'Support for text, images, and audio. Learn your way, in any subject.',
    tag: 'FLEX',
  },
];

interface BrutalistCardProps {
  feature: BrutalistFeature;
  index: number;
}

const BrutalistCard: React.FC<BrutalistCardProps> = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -inset-px bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full p-6 md:p-8 border-2 border-zinc-800 bg-zinc-900/80 group-hover:border-zinc-700 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            {feature.tag}
          </span>
          <div className="w-8 h-8 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
            {feature.icon}
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-black tracking-tight mb-4 text-foreground group-hover:text-white transition-colors">
          {feature.title}
        </h3>

        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {feature.description}
        </p>

        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 group-hover:text-primary transition-colors uppercase tracking-wider">
          Learn more <ArrowRight size={12} />
        </div>
      </div>
    </motion.div>
  );
};

interface BrutalistFeaturesProps {
  className?: string;
}

const BrutalistFeatures: React.FC<BrutalistFeaturesProps> = ({ className = '' }) => {
  return (
    <section id="features" className={`py-24 md:py-32 relative ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-24"
        >
          <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 block">
            Capabilities
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            BUILD YOUR
            <br />
            <span className="text-zinc-500">KNOWLEDGE</span>
            <span className="text-primary"> STACK</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <BrutalistCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export { BrutalistFeatures };


