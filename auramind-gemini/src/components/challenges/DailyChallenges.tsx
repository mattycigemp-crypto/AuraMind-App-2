import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TargetIcon as Target, 
  FlameIcon as Flame, 
  BookOpenIcon as BookOpen, 
  ZapIcon as Zap, 
  AwardIcon as Award, 
  CheckCircle2Icon as CheckCircle2,
  ClockIcon as Clock,
  StarIcon as Star,
  TrophyIcon as Trophy,
  SparklesIcon as Sparkles,
  CalendarIcon as Calendar,
  TrendingUpIcon as TrendingUp,
  XIcon as X
} from '../icons/CustomIcons';

// Glassmorphism utility classes
const glassCard = 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'quest';
  difficulty: 'easy' | 'medium' | 'hard';
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  icon: 'flame' | 'book' | 'zap' | 'target' | 'trophy' | 'star';
  completed: boolean;
  expiresAt?: number;
}

interface DailyChallengesProps {
  onClose?: () => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({ onClose }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'quests'>('daily');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    // Load real challenges data from database
    const loadChallenges = async () => {
      try {
        // TODO: Replace with actual API call
        // const challengesData = await challengesService.getUserChallenges();
        
        // For now, use placeholder structure that would come from API
        const challengesData: Challenge[] = [
          {
            id: '1',
            title: 'Study Streak',
            description: 'Study for 7 consecutive days',
            type: 'daily',
            difficulty: 'medium',
            target: 7,
            current: 5, // Would come from user's actual streak data
            unit: 'days',
            xpReward: 100,
            icon: 'flame',
            completed: false,
            expiresAt: Date.now() + 86400000,
          },
          {
            id: '2',
            title: 'Card Master',
            description: 'Review 50 flashcards today',
            type: 'daily',
            difficulty: 'easy',
            target: 50,
            current: 32, // Would come from user's actual card reviews today
            unit: 'cards',
            xpReward: 50,
            icon: 'book',
            completed: false,
            expiresAt: Date.now() + 86400000,
          },
          {
            id: '3',
            title: 'Perfect Session',
            description: 'Get 90%+ accuracy in a study session',
            type: 'daily',
            difficulty: 'hard',
            target: 1,
            current: 0, // Would come from user's actual session performance
            unit: 'session',
            xpReward: 150,
            icon: 'star',
            completed: false,
            expiresAt: Date.now() + 86400000,
          },
      {
            id: '4',
            title: 'Weekly Warrior',
            description: 'Complete all daily challenges for a week',
            type: 'weekly',
            difficulty: 'hard',
            target: 7,
            current: 4, // Would come from user's actual weekly completion data
            unit: 'days',
            xpReward: 500,
            icon: 'trophy',
            completed: false,
            expiresAt: Date.now() + 604800000,
          },
          {
            id: '5',
            title: 'Deck Creator',
            description: 'Create 3 new flashcard decks',
            type: 'weekly',
            difficulty: 'medium',
            target: 3,
            current: 1, // Would come from user's actual deck creation count
            unit: 'decks',
            xpReward: 200,
            icon: 'target',
            completed: false,
            expiresAt: Date.now() + 604800000,
          },
      {
            id: '6',
            title: 'Knowledge Seeker',
            description: 'Study 500 cards this week',
            type: 'weekly',
            difficulty: 'medium',
            target: 500,
            current: 280, // Would come from user's actual weekly card study count
            unit: 'cards',
            xpReward: 300,
            icon: 'zap',
            completed: false,
            expiresAt: Date.now() + 604800000,
          },
          {
            id: '7',
            title: 'Month Master',
            description: 'Maintain a 30-day study streak',
            type: 'quest',
            difficulty: 'hard',
            target: 30,
            current: 15, // Would come from user's actual monthly streak data
            unit: 'days',
            xpReward: 1000,
            icon: 'trophy',
            completed: false,
          },
          {
            id: '8',
            title: 'Deck Collector',
            description: 'Create 20 flashcard decks',
            type: 'quest',
            difficulty: 'hard',
            target: 20,
            current: 8, // Would come from user's actual deck creation count
            unit: 'decks',
            xpReward: 800,
            icon: 'book',
            completed: false,
          },
        ];
        setChallenges(challengesData);
      } catch (error) {
        console.error('Error loading challenges:', error);
        // Fallback to empty challenges array
        setChallenges([]);
      }
    };

    loadChallenges();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'flame': return Flame;
      case 'book': return BookOpen;
      case 'zap': return Zap;
      case 'target': return Target;
      case 'trophy': return Trophy;
      case 'star': return Star;
      default: return Award;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-400 to-emerald-500';
      case 'medium': return 'from-yellow-400 to-orange-500';
      case 'hard': return 'from-red-400 to-pink-500';
      default: return 'from-blue-400 to-purple-500';
    }
  };

  const getDifficultyBorder = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-green-400/30';
      case 'medium': return 'border-yellow-400/30';
      case 'hard': return 'border-red-400/30';
      default: return 'border-blue-400/30';
    }
  };

  const filteredChallenges = challenges.filter(c => c.type === selectedTab);
  const completedCount = filteredChallenges.filter(c => c.completed).length;
  const totalXP = filteredChallenges.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0);
  const potentialXP = filteredChallenges.reduce((sum, c) => sum + c.xpReward, 0);

  const getTimeRemaining = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const now = Date.now();
    const diff = expiresAt - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Daily Challenges</h1>
            <p className="text-gray-400">Complete challenges to earn XP and unlock achievements</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <Target size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">{completedCount}/{filteredChallenges.length}</p>
            <p className="text-xs text-gray-400">challenges completed</p>
          </div>
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <Star size={20} className="text-yellow-400" />
              <span className="text-sm text-gray-400">XP Earned</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalXP}</p>
            <p className="text-xs text-gray-400">of {potentialXP} potential XP</p>
          </div>
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-green-400" />
              <span className="text-sm text-gray-400">Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">5 days</p>
            <p className="text-xs text-gray-400">keep it up!</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6"
        >
          {[
            { value: 'daily', label: 'Daily', icon: Calendar },
            { value: 'weekly', label: 'Weekly', icon: Calendar },
            { value: 'quests', label: 'Quests', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value as 'daily' | 'weekly' | 'quests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedTab === tab.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Challenges List */}
        <div className="space-y-4">
          {filteredChallenges.map((challenge, index) => {
            const Icon = getIcon(challenge.icon);
            const progress = (challenge.current / challenge.target) * 100;
            const timeRemaining = getTimeRemaining(challenge.expiresAt);

            return (
              <motion.div
                key={challenge.id}
                variants={scaleIn}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`${glassCard} p-6 ${challenge.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${getDifficultyColor(challenge.difficulty)} rounded-xl flex items-center justify-center flex-shrink-0 ${getDifficultyBorder(challenge.difficulty)} border-2`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{challenge.title}</h3>
                        <p className="text-sm text-gray-400">{challenge.description}</p>
                      </div>
                      {challenge.completed && (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 size={20} />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">
                          {challenge.current} / {challenge.target} {challenge.unit}
                        </span>
                        <span className="text-white font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full bg-gradient-to-r ${getDifficultyColor(challenge.difficulty)} rounded-full`}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {timeRemaining && (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock size={14} />
                            <span>{timeRemaining} remaining</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-yellow-400">
                          <Sparkles size={14} />
                          <span>+{challenge.xpReward} XP</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {challenge.difficulty}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredChallenges.length === 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className={`${glassCard} p-12 text-center`}
          >
            <Target size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No challenges available</h3>
            <p className="text-gray-400">Check back later for new challenges!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenges;


