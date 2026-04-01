import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Deck, UserProfile, ViewState } from '../types';
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Edit,
  Copy,
  Share,
  Download,
  Archive,
  Star,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Settings,
  Headphones,
  Mic,
  MicOff,
  Zap,
  CalendarDays,
  Target,
  Award,
  Globe,
  Bell,
  UserPlus,
  Ban,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  Save,
  Upload,
  Sun,
  Moon,
  X,
  User
} from 'lucide-react';
import { useContextMenu, ContextMenuItem } from './ui/ContextMenu';
import OnboardingTutorial from './OnboardingTutorial';
import { useTutorial } from './TutorialSystem';

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  audioEnabled: boolean;
  audioSpeed: 'slow' | 'normal' | 'fast';
  autoPlayAudio: boolean;
  notifications: boolean;
  compactMode: boolean;
}

type SortOption = 'due' | 'recent' | 'name';
type Theme = 'light' | 'dark' | 'auto';
type AudioSpeed = 'slow' | 'normal' | 'fast';

interface UnifiedDashboardProps {
  decks: Deck[];
  cards: Card[];
  onCreateDeck: (title: string, description: string) => Promise<Deck | null | void> | Deck | null | void;
  onSelectDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onGenerateDeck: (topic: string) => Promise<void> | void;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  onLoadDemoData?: () => void;
  user: UserProfile;
  onUpdateUser?: (updates: Partial<UserProfile>) => void;
}

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return 'No reviews yet';
  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.floor(deltaMs / 60000);
  if (deltaMinutes < 1) return 'just now';
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  decks,
  cards,
  onCreateDeck,
  onSelectDeck,
  onDeleteDeck,
  onGenerateDeck,
  onNavigate,
  onLogout,
  onLoadDemoData,
  user,
  onUpdateUser,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('due');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [createDeckError, setCreateDeckError] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'auto',
    audioEnabled: true,
    audioSpeed: 'normal',
    autoPlayAudio: false,
    notifications: true,
    compactMode: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);

  // Tutorial state
  const { isTutorialOpen, closeTutorial } = useTutorial();

  // Calculate dashboard metrics
  const dashboardStats = useMemo(() => {
    const totalCards = cards.length;
    const cardsReviewedToday = cards.filter(card => {
      const lastReviewed = card.lastReviewed;
      if (!lastReviewed) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return lastReviewed >= today.getTime();
    }).length;

    const cardsDue = cards.filter(card => {
      if (!card.nextReview) return false;
      return card.nextReview <= Date.now();
    }).length;

    return {
      totalDecks: decks.length,
      totalCards,
      cardsReviewedToday,
      cardsDue,
      averageAccuracy: 87,
      weeklyProgress: [65, 78, 82, 91, 87, 93, 89],
      recentActivity: [
        { id: '1', type: 'study', description: 'Completed Biology Chapter 5', timestamp: Date.now() - 3600000 },
        { id: '2', type: 'achievement', description: 'Earned Quick Learner badge', timestamp: Date.now() - 7200000 },
        { id: '3', type: 'deck', description: 'Created new Physics deck', timestamp: Date.now() - 10800000 },
      ]
    };
  }, [cards, decks]);

  const deckMetricsById = useMemo(() => {
    const metrics: { [key: string]: { cardCount: number; dueCount: number; masteredCount: number; lastReviewed?: number } } = {};
    
    cards.forEach(card => {
      if (!metrics[card.deckId]) {
        metrics[card.deckId] = { cardCount: 0, dueCount: 0, masteredCount: 0, lastReviewed: undefined };
      }
      metrics[card.deckId].cardCount++;
      if (card.nextReview && card.nextReview <= Date.now()) {
        metrics[card.deckId].dueCount++;
      }
      if (card.lastReviewed) {
        metrics[card.deckId].lastReviewed = Math.max(metrics[card.deckId].lastReviewed || 0, card.lastReviewed);
      }
      if (card.interval >= 7 && card.repetition >= 3) {
        metrics[card.deckId].masteredCount++;
      }
    });

    return metrics;
  }, [cards]);

  const deckSummaries = useMemo(() => {
    return decks.map((deck) => {
      const metrics = deckMetricsById[deck.id] || { cardCount: 0, dueCount: 0, masteredCount: 0, lastReviewed: undefined };
      const masteryPercentage = metrics.cardCount > 0 ? Math.round((metrics.masteredCount / metrics.cardCount) * 100) : 0;
      return {
        ...deck,
        cardCount: metrics.cardCount,
        dueCount: metrics.dueCount,
        masteredCount: metrics.masteredCount,
        masteryPercentage,
        lastReviewed: metrics.lastReviewed,
      };
    });
  }, [decks, deckMetricsById]);

  const studyInsights = useMemo(() => {
    const dueDecks = deckSummaries
      .filter((deck) => deck.dueCount > 0)
      .sort((a, b) => b.dueCount - a.dueCount);

    const mostActiveDeck = deckSummaries
      .slice()
      .sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0))[0];

    const completionRate = dashboardStats.totalCards > 0
      ? Math.round((dashboardStats.cardsReviewedToday / dashboardStats.totalCards) * 100)
      : 0;

    const estimatedMinutes = Math.max(5, Math.ceil(dashboardStats.cardsDue * 1.5));

    return {
      dueDecks,
      mostActiveDeck,
      completionRate,
      estimatedMinutes,
      nextBestAction: dueDecks[0] || null,
    };
  }, [dashboardStats, deckSummaries]);

  const sortedDecks = useMemo(() => {
    const filtered = deckSummaries.filter((deck) =>
      `${deck.title} ${deck.description || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due':
          return b.dueCount - a.dueCount;
        case 'recent':
          return (b.lastReviewed || 0) - (a.lastReviewed || 0);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [deckSummaries, searchQuery, sortBy]);

  const quickStats = [
    {
      label: 'Due now',
      value: dashboardStats.cardsDue,
      detail: studyInsights.nextBestAction ? `${studyInsights.nextBestAction.title} needs attention` : 'Nothing overdue',
      icon: Clock3,
      tone: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      label: 'Study pace',
      value: `${studyInsights.estimatedMinutes} min`,
      detail: 'Estimated time to clear today’s queue',
      icon: CalendarDays,
      tone: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Daily coverage',
      value: `${studyInsights.completionRate}%`,
      detail: dashboardStats.totalCards > 0 ? 'Cards reviewed today vs. full library' : 'Create a deck to start tracking',
      icon: BarChart3,
      tone: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900',
    },
  ];

  const handleCreateDeck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDeckTitle.trim() || isCreatingDeck) return;

    setCreateDeckError('');
    setIsCreatingDeck(true);

    try {
      const newDeck = await onCreateDeck(newDeckTitle, newDeckDescription);
      if (newDeck) {
        setNewDeckTitle('');
        setNewDeckDescription('');
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      setCreateDeckError('Failed to create deck. Please try again.');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleGenerateDeck = async () => {
    if (!generatePrompt.trim()) return;

    setGenerateError('');
    setIsGeneratingDeck(true);

    try {
      await onGenerateDeck(generatePrompt.trim());
      setGeneratePrompt('');
    } catch (error) {
      console.error(error);
      setGenerateError('Deck generation failed. Try a shorter or clearer topic.');
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const handleAudioPlay = (text: string) => {
    if (!userSettings.audioEnabled) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = userSettings.audioSpeed === 'slow' ? 0.8 : userSettings.audioSpeed === 'fast' ? 1.2 : 1;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const handleRecordAudio = () => {
    setIsRecording(!isRecording);
  };

  const getDeckContextMenuItems = (deck: Deck): ContextMenuItem[] => [
    {
      id: 'open',
      label: 'Open Deck',
      icon: ArrowRight,
      action: () => onSelectDeck(deck.id),
    },
    {
      id: 'study',
      label: 'Study Now',
      icon: BookOpen,
      action: () => navigate(`/study/${deck.id}`),
      disabled: deck.cardCount === 0,
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
    },
    {
      id: 'edit',
      label: 'Edit Deck',
      icon: Edit,
      action: () => {
        console.log('Edit deck:', deck.id);
      },
    },
    {
      id: 'separator2',
      label: '',
      separator: true,
    },
    {
      id: 'duplicate',
      label: 'Duplicate Deck',
      icon: Copy,
      action: () => {
        console.log('Duplicate deck:', deck.id);
      },
    },
    {
      id: 'export',
      label: 'Export Deck',
      icon: Download,
      action: () => {
        console.log('Export deck:', deck.id);
      },
    },
    {
      id: 'share',
      label: 'Share Deck',
      icon: Share,
      action: () => {
        console.log('Share deck:', deck.id);
      },
    },
    {
      id: 'separator3',
      label: '',
      separator: true,
    },
    {
      id: 'favorite',
      label: deck.title.includes('⭐') ? 'Remove from Favorites' : 'Add to Favorites',
      icon: Star,
      action: () => {
        console.log('Toggle favorite:', deck.id);
      },
    },
    {
      id: 'archive',
      label: 'Archive Deck',
      icon: Archive,
      action: () => {
        console.log('Archive deck:', deck.id);
      },
    },
    {
      id: 'separator4',
      label: '',
      separator: true,
    },
    {
      id: 'delete',
      label: 'Delete Deck',
      icon: Trash2,
      action: () => onDeleteDeck(deck.id),
      danger: true,
    },
  ];

  const contextMenuData = useContextMenu();
  const contextMenu = contextMenuData.contextMenu;
  const showContextMenu = contextMenuData.showContextMenu;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        console.log('Testing panel toggled');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <BrainCircuit size={20} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AuraMind
                  </h1>
                </div>
                <nav className="hidden md:flex space-x-1">
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Dashboard
                  </button>
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Analytics
                  </button>
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Progress
                  </button>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                  <Search size={20} />
                </button>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="p-2 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  <Settings size={20} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                  >
                    <User size={20} />
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{getGreeting()}, {user.name}</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Your learning dashboard is ready.</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                    Pick up where you left off, review due cards, or create a fresh deck without leaving this page.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                    New Deck
                  </button>
                  <button
                    onClick={() => studyInsights.nextBestAction ? navigate(`/study/${studyInsights.nextBestAction.id}`) : onNavigate(ViewState.GENERATE_CARDS)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <BookOpen size={16} />
                    {studyInsights.nextBestAction ? 'Resume Studying' : 'Generate with AI'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                        <stat.icon size={18} className={stat.tone} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Decks</h3>
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardStats.totalDecks}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">+2 this week</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Cards</h3>
                  </div>
                  <ArrowUp size={16} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardStats.totalCards}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">+15 today</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Zap size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Studied Today</h3>
                  </div>
                  <Activity size={16} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardStats.cardsReviewedToday}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">87% goal</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <Award size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Streak</h3>
                  </div>
                  <ArrowUp size={16} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{7}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.streak || 7} day rhythm</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 mt-6">
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Focus for today</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Prioritized actions based on your due cards and recent activity.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate(ViewState.GENERATE_CARDS)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Open generator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-5 text-white">
                      <p className="text-sm font-medium text-white/80">Next best session</p>
                      <h3 className="text-xl font-semibold mt-2">
                        {studyInsights.nextBestAction ? studyInsights.nextBestAction.title : 'Start a new topic'}
                      </h3>
                      <p className="text-sm text-white/80 mt-2">
                        {studyInsights.nextBestAction
                          ? `${studyInsights.nextBestAction.dueCount} cards are due now.`
                          : 'No overdue cards right now. Generate a new deck or review an existing one.'}
                      </p>
                      <button
                        onClick={() => studyInsights.nextBestAction ? navigate(`/study/${studyInsights.nextBestAction.id}`) : setGeneratePrompt('')}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
                      >
                        <ArrowRight size={16} />
                        {studyInsights.nextBestAction ? 'Study now' : 'Plan next session'}
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-5">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Momentum</p>
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Most recently active</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {studyInsights.mostActiveDeck?.title || 'No study activity yet'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Due decks</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{studyInsights.dueDecks.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">Mastery average</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{dashboardStats.averageAccuracy}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deck Library */}
                <div className="mb-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Decks</h2>
                      <p className="text-slate-600 dark:text-slate-300">
                        {decks.length} deck{decks.length === 1 ? '' : 's'} available
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={16} />
                      New Deck
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search decks by title or description"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Filter size={16} />
                        Sort
                      </div>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as SortOption)}
                        className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="due">Most due</option>
                        <option value="recent">Recently studied</option>
                        <option value="name">A-Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {decks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
                      <BrainCircuit size={32} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No decks yet</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">Create your first deck to get started with AuraMind!</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Plus size={20} />
                      Create Your First Deck
                    </button>
                  </div>
                ) : sortedDecks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-500 dark:text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No matching decks</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Try a different keyword or change the sort to find what you need faster.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedDecks.map((deck, idx) => (
                      <motion.div
                        key={deck.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        whileHover={{ y: -3 }}
                        onClick={() => onSelectDeck(deck.id)}
                        className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-6 z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{deck.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{deck.description || 'No description available'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                                {deck.cardCount} cards
                              </span>
                              <button
                                onClick={() => onDeleteDeck(deck.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete deck"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock3 size={12} />
                            <span>Updated {formatRelativeTime(deck.lastModified)}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {deck.dueCount} due
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              {deck.masteryPercentage}% mastered
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent activity</h3>
                  <div className="mt-5 space-y-4">
                    {dashboardStats.recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick help</h3>
                  <div className="mt-5 space-y-3">
                    <button
                      onClick={() => setSettingsModalOpen(true)}
                      className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Reset your focus</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use ambient audio or open settings for fewer distractions.</p>
                    </button>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Build a new deck quickly</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start with a title now and flesh the details out later.</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generation */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white">
                <h2 className="text-xl font-bold mb-2">AI-Powered Learning</h2>
                <p className="mb-4 opacity-90">
                  Generate flashcards and decks from any topic using advanced AI technology
                </p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter a topic to generate cards..."
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/20 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    onClick={handleGenerateDeck}
                    disabled={!generatePrompt.trim() || isGeneratingDeck}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingDeck ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Deck
                      </>
                    )}
                  </button>
                </div>
                {generateError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{generateError}</p>
                )}
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => handleAudioPlay("Welcome to AuraMind. Your smart learning companion is ready.")}
                disabled={isPlayingAudio}
                className="p-2 rounded text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                title="Play audio"
              >
                {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={handleStopAudio}
                className="p-2 rounded text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 transition-colors"
              >
                <MicOff size={16} />
              </button>
            </div>
          </motion.div>

          {/* Settings Modal */}
          {settingsModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                  <button
                    onClick={() => setSettingsModalOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'auto'] as Theme[]).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setUserSettings(prev => ({ ...prev, theme: theme as Theme }))}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            userSettings.theme === theme
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {theme === 'light' && <Sun size={20} />}
                          {theme === 'dark' && <Moon size={20} />}
                          {theme === 'auto' && <Settings size={20} />}
                          <span className="capitalize">{theme}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Audio</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={userSettings.audioEnabled}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, audioEnabled: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable audio</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Speed</span>
                        <select
                          value={userSettings.audioSpeed}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, audioSpeed: e.target.value as AudioSpeed }))}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="slow">Slow</option>
                          <option value="normal">Normal</option>
                          <option value="fast">Fast</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notifications</h3>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={userSettings.notifications}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {profileModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>
                  <button
                    onClick={() => setProfileModalOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-lg font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Plan</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.plan}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Streak</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.streak} days</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setProfileModalOpen(false);
                        setSettingsModalOpen(true);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Open settings
                    </button>
                    <button
                      onClick={onLogout}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Create Deck Modal */}
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Deck</h2>
                </div>
                
                <form onSubmit={handleCreateDeck}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={newDeckTitle}
                      onChange={(e) => setNewDeckTitle(e.target.value)}
                      placeholder="e.g., Biology Chapter 5"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
                    <textarea
                      value={newDeckDescription}
                      onChange={(e) => setNewDeckDescription(e.target.value)}
                      placeholder="What's this deck about?"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                  {createDeckError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{createDeckError}</p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateDeckError('');
                        setIsCreateModalOpen(false);
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newDeckTitle.trim() || isCreatingDeck}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingDeck ? 'Creating...' : 'Create Deck'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div className="fixed inset-0 z-50">
              {contextMenu}
            </div>
          )}

          {/* Tutorial */}
          <OnboardingTutorial
            isOpen={isTutorialOpen}
            onClose={closeTutorial}
            onComplete={() => {
              console.log('Tutorial completed!');
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default UnifiedDashboard;
