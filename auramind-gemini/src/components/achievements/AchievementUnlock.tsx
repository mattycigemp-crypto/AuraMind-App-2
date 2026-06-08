import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon as Trophy, 
  AwardIcon as Award, 
  StarIcon as Star, 
  FlameIcon as Flame, 
  ZapIcon as Zap, 
  TargetIcon as Target, 
  CrownIcon as Crown,
  MedalIcon as Medal,
  SparklesIcon as Sparkles,
  XIcon as X,
  ZapIcon as LightningZap,
  MoonIcon as Moon,
  SunIcon as Sun,
  FlameIcon as FireFlame,
  AwardIcon as TrophyAward
} from '../icons/CustomIcons';

// Level system constants
const XP_LEVELS = [
  { level: 1, xp: 0, title: 'Novice Learner' },
  { level: 2, xp: 100, title: 'Apprentice Scholar' },
  { level: 3, xp: 250, title: 'Dedicated Student' },
  { level: 4, xp: 500, title: 'Knowledge Seeker' },
  { level: 5, xp: 1000, title: 'Focused Studier' },
  { level: 6, xp: 2000, title: 'Deep Learner' },
  { level: 7, xp: 3500, title: 'Subject Master' },
  { level: 8, xp: 5000, title: 'Expert Scholar' },
  { level: 9, xp: 7500, title: 'Academic Ace' },
  { level: 10, xp: 10000, title: 'Legendary Learner' },
  { level: 11, xp: 15000, title: 'Grand Master' },
  { level: 12, xp: 20000, title: 'Supreme Scholar' },
  { level: 13, xp: 30000, title: 'Ultimate Knowledge' },
  { level: 14, xp: 40000, title: 'Eternal Student' },
  { level: 15, xp: 50000, title: 'Transcendent Sage' }
];

export const calculateLevel = (xp: number) => {
  let level = 1;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      level = XP_LEVELS[i].level;
      break;
    }
  }
  return level;
};

export const getXPForLevel = (level: number) => {
  const levelData = XP_LEVELS.find(l => l.level === level);
  return levelData ? levelData.xp : 0;
};

export const getXPToNextLevel = (xp: number) => {
  const currentLevel = calculateLevel(xp);
  if (currentLevel >= XP_LEVELS[XP_LEVELS.length - 1].level) return 0;
  const nextLevelData = XP_LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevelData ? (nextLevelData.xp - xp) : 0;
};

export const getLevelTitle = (level: number) => {
  const levelData = XP_LEVELS.find(l => l.level === level);
  return levelData ? levelData.title : 'Unknown';
};


// Glassmorphism utility classes
const glassCard = 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl';

// Animation variants
const scaleIn = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 100 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: 100, transition: { duration: 0.3 } },
};

const sparkleVariants = {
  hidden: { opacity: 0, scale: 0 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.4, 
      ease: [0.22, 1, 0.36, 1] as const 
    } 
  },
  exit: { opacity: 0, scale: 0, transition: { duration: 0.2 } },
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'award' | 'star' | 'flame' | 'zap' | 'target' | 'crown' | 'medal';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

interface AchievementUnlockProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

  const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [showSparkles, setShowSparkles] = useState(false);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    setShowSparkles(true);
    if (autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  // Update level progress when component mounts or achievement changes
  useEffect(() => {
    // Get current user XP from localStorage or default to 0
    const savedXP = localStorage.getItem('auramind_user_xp');
    const currentXP = savedXP ? parseInt(savedXP, 10) : 0;
    setUserXP(currentXP);

    // Calculate and update level progress
    const currentLevel = calculateLevel(currentXP);
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const xpProgressInLevel = currentXP - xpForCurrentLevel;
    const progressPercentage = xpNeededForNextLevel > 0 
      ? (xpProgressInLevel / xpNeededForNextLevel) * 100 
      : 100;

    // Update DOM elements
    const levelDisplay = document.getElementById('level-display');
    const levelProgressBar = document.getElementById('level-progress-bar');
    const xpToNext = document.getElementById('xp-to-next');

    if (levelDisplay) levelDisplay.textContent = String(currentLevel);
    if (levelProgressBar) levelProgressBar.style.width = `${progressPercentage}%`;
    if (xpToNext) {
      const remainingXP = getXPToNextLevel(currentXP);
      xpToNext.textContent = `${remainingXP} XP to next level`;
    }

    // Award XP for the achievement
    const newXP = currentXP + achievement.xpReward;
    localStorage.setItem('auramind_user_xp', String(newXP));
    
    // Animate the XP gain
    const animateXP = () => {
      let current = currentXP;
      const target = newXP;
      const increment = Math.max(1, Math.ceil((target - current) / 20));
      
      const timer = setInterval(() => {
        current = Math.min(current + increment, target);
        if (levelDisplay) {
          const level = calculateLevel(current);
          levelDisplay.textContent = String(level);
          
          const xpForLevel = getXPForLevel(level);
          const xpForNext = getXPForLevel(level + 1);
          const xpNeeded = xpForNext - xpForLevel;
          const progress = current - xpForLevel;
          const percentage = xpNeeded > 0 ? (progress / xpNeeded) * 100 : 100;
          
          if (levelProgressBar) {
            levelProgressBar.style.width = `${percentage}%`;
          }
          
          if (xpToNext) {
            const remaining = getXPToNextLevel(current);
            xpToNext.textContent = `${remaining} XP to next level`;
          }
        }
        
        if (current >= target) {
          clearInterval(timer);
        }
      }, 16); // ~60fps
    };

    animateXP();
  }, [achievement]);

  

  const getIcon = () => {
    switch (achievement.icon) {
      case 'trophy': return Trophy;
      case 'award': return Award;
      case 'star': return Star;
      case 'flame': return Flame;
      case 'zap': return Zap;
      case 'target': return Target;
      case 'crown': return Crown;
      case 'medal': return Medal;
      default: return Award;
    }
  };

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'common': return 'from-gray-400 to-gray-500';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = () => {
    switch (achievement.rarity) {
      case 'common': return 'border-gray-400/50';
      case 'rare': return 'border-blue-400/50';
      case 'epic': return 'border-purple-400/50';
      case 'legendary': return 'border-yellow-400/50';
      default: return 'border-gray-400/50';
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit="exit"
        className={`${glassCard} p-8 max-w-md w-full text-center relative overflow-hidden`}
      >
        {/* Sparkle Effects */}
        <AnimatePresence>
          {showSparkles && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={sparkleVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  transition={{ delay: i * 0.05 }}
                  className="absolute"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                >
                  <Sparkles 
                    size={16} 
                    className={`text-${achievement.rarity === 'legendary' ? 'yellow' : achievement.rarity === 'epic' ? 'purple' : achievement.rarity === 'rare' ? 'blue' : 'gray'}-400`}
                  />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Achievement Icon */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="relative mb-6"
        >
          <div className={`w-24 h-24 bg-gradient-to-br ${getRarityColor()} rounded-full flex items-center justify-center mx-auto shadow-2xl ${getRarityBorder()} border-4`}>
            <Icon size={48} className="text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2"
          >
            <Sparkles size={16} className="text-white" />
          </motion.div>
        </motion.div>

        {/* Achievement Text */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wider text-white">
            {achievement.rarity}
          </div>
          <h2 className="text-2xl font-bold text-white">{achievement.title}</h2>
          <p className="text-gray-400">{achievement.description}</p>
          
          {/* Level Progress */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.4 }}
            className="pt-4 border-t border-white/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Current Level</span>
                <span id="level-display">1</span>
              </div>
              <div className="w-full bg-zinc-800/30 h-2 rounded-full overflow-hidden">
                <div id="level-progress-bar" className="bg-primary h-2 transition-all duration-1000" style={{ width: '0%' }}></div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>0 XP</span>
                <span id="xp-to-next">100 XP to next level</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.4 }}
            className="pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Star size={16} />
              <span className="font-bold">+{achievement.xpReward} XP</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Confetti Effect for Legendary */}
        {achievement.rarity === 'legendary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  opacity: 1,
                  rotate: 0
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: 0,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  delay: 0.6 + i * 0.05,
                  duration: 1.5,
                  ease: 'easeOut'
                }}
                className="absolute w-2 h-2"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Achievement Queue System
interface AchievementQueueContextType {
  unlockAchievement: (achievement: Achievement) => void;
}

const AchievementQueueContext = React.createContext<AchievementQueueContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  const unlockAchievement = (achievement: Achievement) => {
    setQueue(prev => [...prev, achievement]);
  };

  const handleNext = () => {
    setCurrent(null);
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length === 0) return [];
        const [next, ...rest] = prev;
        setCurrent(next);
        return rest;
      });
    }, 300);
  };

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
    }
  }, [queue, current]);

  return (
    <AchievementQueueContext.Provider value={{ unlockAchievement }}>
      {children}
      <AnimatePresence>
        {current && (
          <AchievementUnlock
            achievement={current}
            onClose={handleNext}
          />
        )}
      </AnimatePresence>
    </AchievementQueueContext.Provider>
  );
};

export const useAchievements = () => {
  const context = React.useContext(AchievementQueueContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

// Predefined Achievements
export const ACHIEVEMENTS: Record<string, Achievement> = {
  FIRST_DECK: {
    id: 'first_deck',
    title: 'Deck Creator',
    description: 'Create your first flashcard deck',
    icon: 'award',
    rarity: 'common',
    xpReward: 50,
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'flame',
    rarity: 'rare',
    xpReward: 100,
  },
  DECK_MASTER: {
    id: 'deck_master',
    title: 'Deck Master',
    description: 'Create 10 flashcard decks',
    icon: 'trophy',
    rarity: 'rare',
    xpReward: 200,
  },
  SHARP_MIND: {
    id: 'sharp_mind',
    title: 'Sharp Mind',
    description: 'Achieve 90% average retention',
    icon: 'zap',
    rarity: 'epic',
    xpReward: 300,
  },
  LEGENDARY_LEARNER: {
    id: 'legendary_learner',
    title: 'Legendary Learner',
    description: 'Maintain a 30-day study streak',
    icon: 'crown',
    rarity: 'legendary',
    xpReward: 500,
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: 'star',
    rarity: 'epic',
    xpReward: 250,
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete 100 cards in one session',
    icon: 'target',
    rarity: 'rare',
    xpReward: 150,
  },
  KNOWLEDGE_HUNTER: {
    id: 'knowledge_hunter',
    title: 'Knowledge Hunter',
    description: 'Study 1000 total cards',
    icon: 'medal',
    rarity: 'epic',
    xpReward: 400,
  },
};

export default AchievementUnlock;


