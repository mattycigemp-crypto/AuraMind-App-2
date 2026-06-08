import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import CommandPalette, { type CommandItem } from './CommandPalette';
import { analyticsService } from '../../services/analytics/analyticsService';
import { UnifiedDashboard } from './UnifiedDashboard';
import { BookOpenIcon as BookOpen, ZapIcon as Zap } from '../icons/CustomIcons';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  initialPage?: string;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  initialPage = 'main',
  className,
}) => {
  const [activeSection, setActiveSection] = useState(initialPage);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    decks,
    cards,
    onLogout,
    startQuickStudy,
    goToDeck,
  } = useDashboardWorkspace();

  const handleNavigate = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    const routeMap: Record<string, string> = {
      main: '/dashboard',
      cards: '/dashboard/decks',
      chat: '/dashboard/chat',
      generator: '/dashboard/generator',
      analytics: '/dashboard/analytics',
      paths: '/dashboard/paths',
      tutorial: '/dashboard/tutorial',
      quiz: '/dashboard/quiz',
      admin: '/dashboard/admin',
      settings: '/dashboard/settings',
    };
    navigate(routeMap[id] || '/dashboard');
  };

  const handleNavigateNoRoute = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      const hotkey = (e.ctrlKey || e.metaKey) && isK;
      if (!hotkey) return;
      e.preventDefault();
      setPaletteOpen(true);
      analyticsService.trackHeart('engagement', 'open_command_palette', { from: activeSection });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection]);

  useEffect(() => {
    const onSection = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: string }>).detail;
      const section = detail?.section;
      if (!section) return;
      handleNavigate(section);
    };
    window.addEventListener('auramind:navigate-section', onSection as EventListener);
    return () => window.removeEventListener('auramind:navigate-section', onSection as EventListener);
  }, []);

  const searchItems = decks.map((d) => ({
    id: d.id,
    label: d.title,
    href: `/deck/${d.id}`,
  }));

      const paletteItems: CommandItem[] = useMemo(() => {
     const sections: CommandItem[] = [
       { id: 'sec:dashboard', label: 'Go to Overview', group: 'Navigation', onSelect: () => handleNavigate('main') },
       { id: 'sec:cards', label: 'Go to Cards & decks', group: 'Navigation', onSelect: () => handleNavigate('cards') },
       { id: 'sec:chat', label: 'Go to AI Chat', group: 'Navigation', onSelect: () => handleNavigate('chat') },
       { id: 'sec:generator', label: 'Go to Generator', group: 'Navigation', onSelect: () => handleNavigate('generator') },
       { id: 'sec:analytics', label: 'Go to Analytics', group: 'Navigation', onSelect: () => handleNavigate('analytics') },
        { id: 'sec:paths', label: 'Go to Paths', group: 'Navigation', onSelect: () => handleNavigate('paths') },
        { id: 'sec:tutorial', label: 'Go to Tutorial', group: 'Navigation', onSelect: () => handleNavigate('tutorial') },
        { id: 'sec:quiz', label: 'Go to Quizzes', group: 'Navigation', onSelect: () => handleNavigate('cards') },
        { id: 'sec:settings', label: 'Go to Settings', group: 'Navigation', onSelect: () => handleNavigate('settings') },
     ];

    const actions: CommandItem[] = [
      {
        id: 'act:study',
        label: 'Start study now',
        hint: 'Picks due cards first',
        group: 'Actions',
        onSelect: () => startQuickStudy(),
      },
      {
        id: 'act:logout',
        label: 'Sign out',
        group: 'Actions',
        onSelect: () => onLogout(),
      },
    ];

    const deckItems: CommandItem[] = decks.slice(0, 50).map((d) => ({
      id: `deck:${d.id}`,
      label: d.title,
      hint: 'Open deck',
      group: 'Decks',
      onSelect: () => goToDeck(d.id),
    }));

    return [...sections, ...actions, ...deckItems];
  }, [decks, goToDeck, onLogout, startQuickStudy]);

  const handleExternalNavigate = (href: string) => {
    analyticsService.trackHeart('engagement', 'topbar_search_navigate', { href });
    navigate(href);
  };

  return (
    <div className={className}>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={paletteItems}
      />
      
      <UnifiedDashboard
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role as 'user' | 'admin' | 'manager' | 'owner') || 'user',
          plan: user.plan || 'Free',
          streak: user.streak
        }}
        cards={cards.map(c => ({ ...c, front: c.front || '', back: c.back || '', nextReview: c.nextReview || Date.now() }))}
        decks={decks.map(d => ({ ...d, title: d.title, cardCount: d.cardCount || 0 }))}
        onNavigate={handleNavigate}
        onStartStudy={startQuickStudy}
        onCreateDeck={() => handleNavigate('cards')}
        onDeckClick={(id) => navigate('/deck/' + id)}
        initialPage={activeSection}
        onLogout={onLogout}
      />
    </div>
  );
};

export default DashboardLayout;



