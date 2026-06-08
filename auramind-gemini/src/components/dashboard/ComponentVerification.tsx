import React from 'react';
import DashboardLayout from './DashboardLayout';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import StatCard from './StatCard';
import FocusCore from './FocusCore';
import GlassCard from '../shared/GlassCard';
import { LayersIcon as Layers } from '../icons/CustomIcons';
import { DashboardWorkspaceProvider } from '../../contexts/DashboardWorkspaceContext';
import type { UserProfile } from '../../types';

const mockUser: UserProfile = {
  id: 'component-verify-user',
  name: 'Verify UI',
  email: 'verify@test.com',
  plan: 'Starter',
  streak: 0,
  streakFreezes: 0,
  joinedDate: Date.now(),
  isEmailVerified: true,
  isPhoneVerified: false,
};

// Verification component to test dashboard wiring
const ComponentVerification: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-neural text-on-surface">
      <h1 className="text-primary text-2xl font-bold p-8">Component Verification Test</h1>

      <div className="p-8 space-y-8">
        <GlassCard>
          <h2 className="text-primary text-xl">GlassCard Component Working</h2>
          <p className="text-on-surface">This verifies the glass morphism effect is working.</p>
        </GlassCard>

        <StatCard
          title="Test Stat"
          value="100%"
          icon={Layers}
          trend={{ value: "+5% Test", type: "positive" }}
        />

        <FocusCore percentage={75} status="Test Mode Active" />

        <div className="flex">
          <Sidebar activeItem="dashboard" className="relative" />
        </div>

        <TopAppBar
          userName="Verify UI"
          userEmail="verify@test.com"
          planLabel="Starter plan"
          onLogout={() => {}}
          searchItems={[{ id: '1', label: 'Demo deck', href: '/deck/demo' }]}
          className="relative left-0 md:left-0 top-0 z-10"
        />

        <DashboardWorkspaceProvider
          user={mockUser}
          decks={[]}
          cards={[]}
          createDeck={async () => null}
          deleteDeck={async () => {}}
          addCardsToDeck={async () => undefined}
          onLogout={() => {}}
        >
          <DashboardLayout initialPage="dashboard" />
        </DashboardWorkspaceProvider>
      </div>
    </div>
  );
};

export default ComponentVerification;



