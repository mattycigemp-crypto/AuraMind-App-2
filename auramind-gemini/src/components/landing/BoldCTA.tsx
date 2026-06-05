import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRightIcon as ArrowRight, CheckCircle2Icon as CheckCircle2, DownloadIcon as Download, MonitorIcon as Monitor, SmartphoneIcon as Smartphone } from '../../components/icons/CustomIcons';

interface BoldCTAProps {
  className?: string;
}

const BoldCTA: React.FC<BoldCTAProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const benefits = [
    'Free forever plan',
    'No credit card required',
    'Export your data anytime',
    'Private & secure',
  ];

  return (
    <section className={`py-24 md:py-32 relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-background" />
      
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99, 102, 241, 0.5) 2px, rgba(99, 102, 241, 0.5) 4px)' }} 
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-none">
            READY TO
            <br />
            <span className="text-primary">LEVEL UP</span>
            <span className="text-zinc-500">?</span>
          </h2>

          <p className="text-lg text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Join thousands of learners who have already transformed their study habits.
            Start building your knowledge stack today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => navigate('/auth')}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-black font-bold text-base uppercase tracking-wider hover:bg-primary/90 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/download"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-zinc-900 border border-zinc-700 text-foreground font-bold text-base uppercase tracking-wider hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
            >
              <Download size={20} />
              Download Native Apps
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-zinc-400 hover:border-primary/50 hover:text-foreground transition-all"
            >
              <Monitor size={16} />
              Windows · macOS · Linux
            </Link>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-zinc-400 hover:border-primary/50 hover:text-foreground transition-all"
            >
              <Smartphone size={16} />
              iOS · Android (Coming Soon)
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            {benefits.map((benefit) => (
              <span key={benefit} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" />
                {benefit}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
    </section>
  );
};

export { BoldCTA };


