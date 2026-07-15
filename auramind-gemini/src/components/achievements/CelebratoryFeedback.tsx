import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConfettiIcon as Confetti, 
  SparklesIcon as Sparkles, 
  StarIcon as Star, 
  TrophyIcon as Trophy,
  FlameIcon as Flame,
  ZapIcon as Zap,
  AwardIcon as Award
} from '../icons/CustomIcons';

// Glassmorphism utility classes
const glassCard = 'bg-zinc-900/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl';

// Animation variants
const popIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: 'spring' as const,
      stiffness: 300,
      damping: 20
    } 
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const slideIn = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, x: 50, transition: { duration: 0.2 } },
};

interface CelebratoryFeedbackProps {
  type: 'achievement' | 'streak' | 'milestone' | 'perfect';
  message: string;
  subMessage?: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const CelebratoryFeedback: React.FC<CelebratoryFeedbackProps> = ({
  type,
  message,
  subMessage,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    if (autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'streak': return Flame;
      case 'milestone': return Star;
      case 'perfect': return Zap;
      default: return Award;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'achievement': return 'from-yellow-400 to-orange-500';
      case 'streak': return 'from-orange-400 to-red-500';
      case 'milestone': return 'from-purple-400 to-pink-500';
      case 'perfect': return 'from-green-400 to-emerald-500';
      default: return 'from-blue-400 to-purple-500';
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed top-4 right-4 z-[9998]">
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            variants={slideIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`${glassCard} p-4 flex items-center gap-4 min-w-[300px]`}
          >
            {/* Icon */}
            <motion.div
              variants={popIn}
              initial="hidden"
              animate="show"
              className={`w-12 h-12 bg-gradient-to-br ${getColor()} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <Icon size={24} className="text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-bold text-white"
              >
                {message}
              </motion.p>
              {subMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-gray-400"
                >
                  {subMessage}
                </motion.p>
              )}
            </div>

            {/* Sparkle */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Sparkles size={16} className="text-yellow-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mini Celebration for smaller achievements
interface MiniCelebrationProps {
  icon: React.ReactNode;
  message: string;
  onClose: () => void;
}

const MiniCelebration: React.FC<MiniCelebrationProps> = ({ icon, message, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={popIn}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-4 right-4 z-[9998] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
        >
          {icon}
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Full-screen celebration for major achievements
interface FullScreenCelebrationProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  duration?: number;
}

const FullScreenCelebration: React.FC<FullScreenCelebrationProps> = ({
  title,
  subtitle,
  onClose,
  duration = 5000,
}) => {
  const [show, setShow] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE66D'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        >
          {/* Confetti Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: `${particle.x}%`, 
                  y: '-10%', 
                  opacity: 1,
                  rotate: 0
                }}
                animate={{ 
                  y: '110%',
                  opacity: 0,
                  rotate: particle.id * 36
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.5
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: particle.color,
                  left: `${particle.x}%`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`${glassCard} p-12 text-center max-w-lg relative`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Trophy size={48} className="text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-4"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-300 mb-8"
            >
              {subtitle}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { CelebratoryFeedback, MiniCelebration, FullScreenCelebration };


