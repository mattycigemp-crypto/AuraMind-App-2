import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserProfile } from '../../types';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { UnifiedDashboard } from './UnifiedDashboard';
import CardsDecks from './CardsDecks';
import AnalyticsDashboard from './AnalyticsDashboard';
import { StudyOverview } from './StudyOverview';

const GeneratorPage = React.lazy(() => import('../../pages/generator/GeneratorPage'));
const TutorialPage = React.lazy(() => import('./TutorialPage'));

type Props = {
  initialPage?: string;
};

const DashboardLayout: React.FC<Props> = ({ initialPage = 'main' }) => {
  const location = useLocation();
  const path = location.pathname;
  const workspace = useDashboardWorkspace();
  const { user, decks, cards, createDeck, deleteDeck, addCardsToDeck, onLogout } = workspace!;

  if (path === '/dashboard/decks') {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        <CardsDecks />
      </div>
    );
  }

  if (path === '/dashboard/study') {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        <StudyOverview />
      </div>
    );
  }

  if (path === '/dashboard/generator') {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="text-[#5A5A72] text-sm">Loading...</div></div>}>
          <GeneratorPage />
        </Suspense>
      </div>
    );
  }

  if (path === '/dashboard/tutorial') {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="text-[#5A5A72] text-sm">Loading...</div></div>}>
          <TutorialPage />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <UnifiedDashboard
        user={user as UserProfile}
        decks={decks}
        cards={cards}
        createDeck={createDeck}
        deleteDeck={deleteDeck}
        addCardsToDeck={addCardsToDeck}
        onLogout={onLogout}
        initialPage={initialPage}
      />
    </div>
  );
};

export default DashboardLayout;
