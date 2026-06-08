import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  LayersIcon as Layers,
  PlusIcon as Plus, PlayIcon as Play, TargetIcon as Target, FlameIcon as Flame, FolderOpenIcon as FolderOpen,
  BrainCircuitIcon,
  BookOpenIcon as BookOpen,
  BotIcon as Bot,
} from '../icons/CustomIcons';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import StatCard from './StatCard';
import MobileTabBar from './MobileTabBar';
import SourceGroundedChat from '../chat/SourceGroundedChat';
import CardsDecks from './CardsDecks';
import QuoteOfTheDay from './QuoteOfTheDay';
import WordOfTheDay from './WordOfTheDay';
import LearningPaths from './LearningPaths';
import TutorialPage from './TutorialPage';
import AnalyticsPage from '../../pages/dashboard/AnalyticsPage';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import GeneratorPage from '../../pages/generator/GeneratorPage';
import SettingsPage from '../../pages/settings/SettingsPage';
import { trackPageVisit, getTopSections, type SectionRanking } from '../../services/analytics/pageVisitTracker';
import { usePlatform, useHaptics, useSplashScreen, useKeyboard, useAppLifecycle } from '../../hooks/useNative';


type UserRole = 'user' | 'admin' | 'manager' | 'owner';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  streak?: number;
}

interface UnifiedDashboardProps {
  user: User;
  cards: { id: string; front: string; back: string; nextReview: number; lastReviewed?: number; interval?: number; repetition?: number }[];
  decks: { id: string; title: string; cardCount: number }[];
  onNavigate: (section: string) => void;
  onStartStudy: () => void;
  onCreateDeck: () => void;
  onDeckClick?: (id: string) => void;
  initialPage?: string;
  onLogout: () => void;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  user,
  cards,
  decks,
  onNavigate,
  onStartStudy,
  onCreateDeck,
  onDeckClick,
  initialPage = 'main',
  onLogout
}) => {
  const platform = usePlatform();
  const { hide: hideSplash } = useSplashScreen();
  const { isOpen: keyboardOpen } = useKeyboard();
  const appState = useAppLifecycle();
  const { impact } = useHaptics();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [charVersion, setCharVersion] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hideSplash();
    
    const interval = setInterval(() => {
      const v = parseInt(localStorage.getItem('auramind-char-version') || '0');
      if (v !== charVersion) setCharVersion(v);
    }, 500);
    return () => clearInterval(interval);
  }, [charVersion, hideSplash]);

  // Native app lifecycle handling
  useEffect(() => {
    if (appState === 'active') {
      // App came to foreground - refresh data
    }
  }, [appState]);
  
  const dashCharId = localStorage.getItem('auramind-character-id') || 'matt';
  const dashUploadedImage = localStorage.getItem('auramind-uploaded-image');
  const dashCustomRaw = localStorage.getItem('auramind-custom-characters');
  const dashCustomChars = dashCustomRaw ? (() => { try { return JSON.parse(dashCustomRaw); } catch { return []; } })() : [];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(initialPage);

  const handleNavigate = (item: string) => {
    const wasChange = activeItem !== item;
    setActiveItem(item);
    onNavigate(item);
    setMobileNavOpen(false);
    if (wasChange) {
      trackPageVisit(item);
    }
  };

  const dueCount = useMemo(() => cards.filter(c => (c.nextReview || 0) <= Date.now()).length, [cards]);

  const searchItems = useMemo(() => decks.map(d => ({
    id: d.id,
    label: d.title,
    href: `/deck/${d.id}`
  })), [decks]);

  const badgeCounts = useMemo(() => ({
    dashboard: dueCount,
    cards: decks.length,
  }), [dueCount, decks.length]);

  const renderContent = () => {
    switch (activeItem) {
      case 'main':
        return <OverviewPage 
          user={user} 
          dueCount={dueCount} 
          totalCards={cards.length}
          totalDecks={decks.length}
          onStartStudy={onStartStudy}
          onCreateDeck={onCreateDeck}
          onNavigate={(section) => handleNavigate(section)}
        />;
      case 'cards':
        return <CardsDecks />;
      case 'chat':
        return <SourceGroundedChat />;
      case 'generator':
        return <GeneratorPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'paths':
        return <LearningPaths user={user} />;
      case 'tutorial':
        return <TutorialPage />;
      case 'quiz':
        return null;
      case 'settings':
        return <SettingsPage user={user} onLogout={onLogout} />;
      default:
        return <OverviewPage user={user} dueCount={dueCount} totalCards={cards.length} totalDecks={decks.length} onStartStudy={onStartStudy} onCreateDeck={onCreateDeck} onNavigate={(section) => handleNavigate(section)} />;
    }
  };

  if (activeItem === 'admin' && (user.role === 'admin' || user.role === 'owner')) {
    return <AdminDashboard onBackToDashboard={() => handleNavigate('main')} />;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-primary/30 selection:text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeItem === 'main' ? 'dashboard' : activeItem}
        onNavigate={(id) => handleNavigate(id === 'dashboard' ? 'main' : id)}
        onQuickStudy={onStartStudy}
        badgeCounts={badgeCounts}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userRole={user.role}
        className={cn(
          "transition-transform duration-500 ease-in-out z-[60]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      />

      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55] md:hidden animate-in fade-in duration-500"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-500 relative min-w-0",
          isCollapsed ? "md:pl-20" : "md:pl-[280px]"
        )}
      >
        <TopAppBar 
          userName={user.name}
          userEmail={user.email}
          planLabel={user.plan}
          onLogout={onLogout}
          onMobileMenuClick={() => setMobileNavOpen(true)}
          searchItems={searchItems}
          onNavigate={(path) => {
            if (path.startsWith('/deck/')) {
              onDeckClick?.(path.split('/').pop() || '');
            }
          }}
          characterId={dashCharId}
          customCharacters={dashCustomChars}
          uploadedImage={dashUploadedImage}
          className={cn(
             "transition-all duration-500",
             isCollapsed ? "md:left-20" : "md:left-[280px]"
          )}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="p-6 md:p-12 max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
</main>
        {/* Mobile Tab Bar for native apps */}
        <MobileTabBar
          activeTab={activeItem === 'main' ? 'dashboard' : activeItem}
          onTabChange={handleNavigate}
          badgeCounts={badgeCounts}
        />
      </div>
    </div>
  );
};

interface OverviewPageProps {
  user: User;
  dueCount: number;
  totalCards: number;
  totalDecks: number;
  onStartStudy: () => void;
  onCreateDeck: () => void;
  onNavigate: (section: string) => void;
}

const QuickActionIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Layers,
  BrainCircuit: BrainCircuitIcon,
  FolderOpen,
  BookOpen,
  Bot,
  Play,
};

const OverviewPage: React.FC<OverviewPageProps> = ({ user, dueCount, totalCards, totalDecks, onStartStudy, onCreateDeck, onNavigate }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = `${weekdays[new Date().getDay()]} · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const topSections: SectionRanking[] = getTopSections(4);

  return (
    <div className="space-y-10 pb-20">
      <header>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          {greeting}, {user.name.split(' ')[0]}
        </h1>
        {dueCount > 0 && (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            You have <span className="text-primary font-semibold">{dueCount} card{dueCount !== 1 ? 's' : ''} due</span> for review
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Due for Review" value={dueCount} subtitle={dueCount === 1 ? 'card waiting' : 'cards waiting'} icon={Target} variant="focus" />
        <StatCard title="Streak" value={user.streak ?? 0} subtitle="day streak" icon={Flame} />
        <StatCard title="Total Cards" value={totalCards.toLocaleString()} subtitle="flashcards" icon={Layers} />
        <StatCard title="Decks" value={totalDecks} subtitle={`deck${totalDecks !== 1 ? 's' : ''}`} icon={FolderOpen} />
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuoteOfTheDay />
            <WordOfTheDay />
          </div>

          <div className="architectural-panel p-8 rounded-[24px] border-primary/15">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
              {dueCount > 0 ? 'Ready to study?' : 'All caught up!'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
              {dueCount > 0
                ? `You have ${dueCount} card${dueCount !== 1 ? 's' : ''} ready for review. Spaced repetition keeps your memory strong — a quick session now saves time later.`
                : 'Every card is up to date. Create new flashcards or explore the Generator to build more study material.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStartStudy}
                disabled={dueCount === 0}
                className="btn-arch h-12 px-8 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={18} className="fill-current mr-2 inline-block" />
                Start Review
              </button>
              <button
                onClick={onCreateDeck}
                className="btn-arch-outline h-12 px-8 rounded-xl text-sm font-semibold border-primary/30 hover:border-primary"
              >
                <Plus size={18} className="mr-2 inline-block" />
                New Deck
              </button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-3">
            {topSections.map((section) => {
              const Icon = QuickActionIcons[section.iconName] || Layers;
              return (
                <QuickAction
                  key={section.section}
                  icon={Icon}
                  label={section.label}
                  description={section.visitCount > 0
                    ? section.description
                    : 'Discover this feature'}
                  onClick={() => onNavigate(section.section)}
                />
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ComponentType<{ size?: number; className?: string }>; label: string; description: string; onClick: () => void }> = ({ icon: Icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left architectural-panel p-5 rounded-[20px] border-primary/10 bg-primary/[0.01] hover:bg-primary/[0.04] hover:border-primary/25 transition-all group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-900 border border-primary/20 flex items-center justify-center shrink-0 group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors">
        <Icon size={18} className="text-primary/80 group-hover:text-primary transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">{label}</div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5 truncate">{description}</div>
      </div>
    </div>
  </button>
);



const PageHeader: React.FC<{ title: string; description?: string; action?: { label: string; onClick: () => void; primary?: boolean } }> = ({ title, description, action }) => {
  return (
    <div className="mb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-impact-md text-zinc-900 dark:text-white leading-none tracking-tight">{title}</h1>
          {description && <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] italic opacity-80">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              "h-14 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest",
              action.primary 
                ? "btn-arch group overflow-hidden" 
                : "btn-arch-outline border-primary/20 text-primary/70 hover:text-primary hover:border-primary"
            )}
          >
            {action.primary && <div className="absolute inset-0 bg-gradient-to-r from-primary to-cosmic opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
            <span className="relative z-10 flex items-center gap-3">
              {action.primary && <Plus size={18} />}
              {action.label}
            </span>
          </button>
        )}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-primary/30 via-primary/5 to-transparent mt-10" />
    </div>
  );
};

export { UnifiedDashboard, PageHeader };



