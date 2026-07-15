import React from 'react';
import type { UserProfile, Deck, Card } from '../types';
import { DashboardWorkspaceProvider } from '../contexts/DashboardWorkspaceContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';

export interface AuraMindCompleteProps {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  createDeck: (title: string, description: string) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<void>;
  addCardsToDeck: (deckId: string, newCards: any[]) => Promise<number | undefined>;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
  initialPage?: string;
}

const AuraMindComplete: React.FC<AuraMindCompleteProps> = ({
  user,
  decks,
  cards,
  createDeck,
  deleteDeck,
  addCardsToDeck,
  updateProfile,
  onLogout,
  initialPage = 'main',
}) => {
  return (
    <DashboardWorkspaceProvider
      user={user}
      decks={decks}
      cards={cards}
      createDeck={createDeck}
      deleteDeck={deleteDeck}
      addCardsToDeck={addCardsToDeck}
      updateProfile={updateProfile || (async () => { console.warn('updateProfile called but not provided to AuraMindComplete'); })}
      onLogout={onLogout}
    >
      <DashboardLayout initialPage={initialPage} />
    </DashboardWorkspaceProvider>
  );
};

export default AuraMindComplete;
