import React from 'react';
import DashboardLayout from './DashboardLayout';
import { DashboardWorkspaceProvider } from '../../contexts/DashboardWorkspaceContext';
import type { UserProfile } from '../../types';

const mockUser: UserProfile = {
  id: 'dashboard-test-user',
  name: 'Deck Tester',
  email: 'test@example.com',
  plan: 'Starter',
  streak: 0,
  streakFreezes: 0,
  joinedDate: Date.now(),
  isEmailVerified: true,
  isPhoneVerified: false,
};

// Simple harness to verify layout + workspace wiring
const DashboardTest: React.FC = () => {
  return (
    <DashboardWorkspaceProvider
      user={mockUser}
      decks={[]}
      cards={[]}
      createDeck={async () => null}
      deleteDeck={async () => {}}
      addCardsToDeck={async () => undefined}
      updateProfile={async () => {}}
      onLogout={() => {}}
    >
      <DashboardLayout initialPage="dashboard" />
    </DashboardWorkspaceProvider>
  );
};

export default DashboardTest;



