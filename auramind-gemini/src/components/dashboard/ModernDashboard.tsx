import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon as Home, 
  LayersIcon as Layers, 
  BotIcon as Bot, 
  BarChart3Icon as BarChart3, 
  BookOpenIcon as BookOpen, 
  SettingsIcon as Settings, 
  LogOutIcon as LogOut,
  SearchIcon as Search,
  BellIcon as Bell,
  ChevronRightIcon as ChevronRight,
  TargetIcon as Target,
  FlameIcon as Flame,
  ClockIcon as Clock,
  ArrowRightIcon as ArrowRight,
  PlayIcon as Play,
  TrendingUpIcon as TrendingUp,
  TrendingDownIcon as TrendingDown,
  PlusIcon as Plus,
  MenuIcon as Menu,
  XIcon as X
} from '../icons/CustomIcons';
import { useNavigate } from 'react-router-dom';

interface ModernSidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  className?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'cards', label: 'Decks & Cards', icon: Layers },
  { id: 'chat', label: 'AI Chat', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'paths', label: 'Paths', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  activeItem, 
  onNavigate,
  className = '' 
}) => {
  return (
    <aside className={`w-64 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${className}`}>
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
          AURAMIND
        </div>
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
          Learning Platform
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-violet-600/20 text-violet-400 border-l-2 border-violet-500' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <Settings size={18} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

interface ModernHeaderProps {
  userName: string;
  userEmail: string;
  onMobileMenuClick?: () => void;
  className?: string;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  userName,
  userEmail,
  onMobileMenuClick,
  className = ''
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className={`h-16 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 ${className}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMobileMenuClick}
          className="md:hidden p-2 text-zinc-400 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
        >
          <Menu size={20} />
        </button>
        
        <div className={`relative transition-all duration-300 ${searchFocused ? 'w-96' : 'w-64'}`}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search decks, cards..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 bg-violet-600/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-violet-400">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-zinc-900 dark:text-white">{userName}</div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500">{userEmail}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  delay = 0 
}) => {
  const isUp = changeType === 'up';
  const isDown = changeType === 'down';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {title}
        </span>
        <div className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-violet-400 transition-colors">
          {icon}
        </div>
      </div>
      
      <div className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
        {value}
      </div>
      
      {change && (
        <div className={`text-xs font-medium flex items-center gap-1 ${
          isUp ? 'text-green-600 dark:text-green-400' : isDown ? 'text-red-500 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'
        }`}>
          {isUp && <TrendingUp size={12} />}
          {isDown && <TrendingDown size={12} />}
          {change}
        </div>
      )}
    </motion.div>
  );
};

interface WelcomePanelProps {
  dueCount: number;
  streak: number;
  onStartStudy: () => void;
  onCreateDeck: () => void;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  dueCount,
  streak,
  onStartStudy,
  onCreateDeck
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-8 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
            Ready to study?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {dueCount > 0 
              ? `You have ${dueCount} cards due for review`
              : 'All caught up! Add more cards to keep learning'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20">
          <Flame size={20} className="text-orange-400" />
          <span className="text-lg font-bold text-orange-400">{streak}</span>
          <span className="text-xs text-orange-400/70">day streak</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onStartStudy}
          disabled={dueCount === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Play size={16} />
          Start Session
        </button>
        
        <button
          onClick={onCreateDeck}
          className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-sm uppercase tracking-wider hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
        >
          <Plus size={16} />
          New Deck
        </button>
      </div>
    </motion.div>
  );
};

interface MiniChartProps {
  data: number[];
  className?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, className = '' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className={`flex items-end gap-1 h-16 ${className}`}>
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 bg-primary/30 hover:bg-primary/60 transition-colors rounded-t"
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        );
      })}
    </div>
  );
};

interface RetentionPanelProps {
  retention: number;
  weeklyData: number[];
}

const RetentionPanel: React.FC<RetentionPanelProps> = ({ retention, weeklyData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="p-6 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
            Retention
          </h3>
          <div className="text-3xl font-black text-zinc-900 dark:text-white">{retention}%</div>
        </div>
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </div>

      <MiniChart data={weeklyData} />
      
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-zinc-400 dark:text-zinc-500">Last 7 days</span>
        <span className="text-green-400 font-medium">+2.3%</span>
      </div>
    </motion.div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
  delay?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  onClick,
  icon,
  delay = 0
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className="w-full p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-violet-400 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{title}</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">{description}</div>
        </div>
        <ArrowRight size={16} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
      </div>
    </motion.button>
  );
};

interface ModernDashboardProps {
  userName: string;
  userEmail: string;
  dueCount: number;
  streak: number;
  totalCards: number;
  totalDecks: number;
  retention: number;
  onNavigate: (section: string) => void;
  onStartStudy: () => void;
  onCreateDeck: () => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
  userName,
  userEmail,
  dueCount,
  streak,
  totalCards,
  totalDecks,
  retention,
  onNavigate,
  onStartStudy,
  onCreateDeck,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleNavigate = (item: string) => {
    setActiveItem(item);
    if (item === 'dashboard') {
      onNavigate('main');
    } else {
      onNavigate(item);
    }
    setSidebarOpen(false);
  };

  const weeklyData = [12, 19, 15, 25, 22, 30, 28];

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed z-50 md:hidden"
            >
              <ModernSidebar 
                activeItem={activeItem} 
                onNavigate={handleNavigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:block">
        <ModernSidebar 
          activeItem={activeItem} 
          onNavigate={handleNavigate}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <ModernHeader
          userName={userName}
          userEmail={userEmail}
          onMobileMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white">
                Good morning, {userName.split(' ')[0]}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Here's your learning overview for today
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Due Now"
                value={dueCount}
                change={dueCount > 0 ? 'Needs attention' : 'All clear'}
                changeType={dueCount > 0 ? 'down' : 'up'}
                icon={<Target size={20} />}
                delay={0.1}
              />
              <KPICard
                title="Streak"
                value={streak}
                change="days"
                changeType="neutral"
                icon={<Flame size={20} />}
                delay={0.15}
              />
              <KPICard
                title="Total Cards"
                value={totalCards.toLocaleString()}
                change="+24 this week"
                changeType="up"
                icon={<Layers size={20} />}
                delay={0.2}
              />
              <KPICard
                title="Decks"
                value={totalDecks}
                change="active"
                changeType="neutral"
                icon={<BookOpen size={20} />}
                delay={0.25}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <WelcomePanel
                  dueCount={dueCount}
                  streak={streak}
                  onStartStudy={onStartStudy}
                  onCreateDeck={onCreateDeck}
                />
              </div>

              <div className="space-y-6">
                <RetentionPanel 
                  retention={retention}
                  weeklyData={weeklyData}
                />

                <div className="space-y-3">
                  <QuickAction
                    title="Review Weak Spots"
                    description="Focus on cards you're forgetting"
                    onClick={() => onNavigate('analytics')}
                    icon={<Target size={20} />}
                    delay={0.4}
                  />
                  <QuickAction
                    title="AI Study Assistant"
                    description="Get help with any topic"
                    onClick={() => onNavigate('chat')}
                    icon={<Bot size={20} />}
                    delay={0.45}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export { ModernDashboard, ModernSidebar, ModernHeader, KPICard, WelcomePanel, RetentionPanel, QuickAction };


