import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Deck, Card } from '../types';
import { analyticsService } from '../services/analytics/analyticsService';

export type DashboardCreateDeck = (title: string, description: string) => Promise<Deck | null>;
export type DashboardDeleteDeck = (id: string) => Promise<void>;

export interface DashboardWorkspaceValue {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  onLogout: () => void;
  createDeck: DashboardCreateDeck;
  deleteDeck: DashboardDeleteDeck;
  addCardsToDeck: (deckId: string, newCards: Array<{ question?: string; answer?: string; front?: string; back?: string }>) => Promise<number | undefined>;
  goToDeck: (deckId: string) => void;
  startStudyForDeck: (deckId: string) => void;
  /** Picks a deck with due cards, else the first deck */
  startQuickStudy: () => void;
}

const DashboardWorkspaceContext = createContext<DashboardWorkspaceValue | null>(null);

export interface DashboardWorkspaceProviderProps {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  createDeck: DashboardCreateDeck;
  deleteDeck: DashboardDeleteDeck;
  addCardsToDeck: (deckId: string, newCards: Array<{ question?: string; answer?: string; front?: string; back?: string }>) => Promise<number | undefined>;
  onLogout: () => void;
  children: React.ReactNode;
}

export const DashboardWorkspaceProvider: React.FC<DashboardWorkspaceProviderProps> = ({
  user,
  decks,
  cards,
  createDeck,
  deleteDeck,
  addCardsToDeck,
  onLogout,
  children,
}) => {
  const navigate = useNavigate();

  const goToDeck = useCallback((deckId: string) => {
    analyticsService.trackHeart('engagement', 'open_deck', { deckId });
    navigate(`/deck/${deckId}`);
  }, [navigate]);

  const startStudyForDeck = useCallback((deckId: string) => {
    analyticsService.trackCoreAction('study_session', { source: 'dashboard', deckId });
    analyticsService.trackHeart('task_success', 'start_study', { deckId });
    navigate(`/study/${deckId}`);
  }, [navigate]);

  const startQuickStudy = useCallback(() => {
    if (decks.length === 0) return;
    const now = Date.now();
    const deckWithDue = decks.find((d) =>
      cards.some((c) => c.deckId === d.id && c.nextReview <= now)
    );
    const pick = deckWithDue ?? decks[0];
    analyticsService.trackCoreAction('study_session', { source: 'quick_study', deckId: pick.id });
    analyticsService.trackHeart('task_success', 'start_quick_study', {
      deckId: pick.id,
      dueCount: cards.filter((c) => c.deckId === pick.id && c.nextReview <= now).length,
    });
    navigate(`/study/${pick.id}`);
  }, [decks, cards, navigate]);

  const value = useMemo(
    () => ({
      user,
      decks,
      cards,
      onLogout,
      createDeck,
      deleteDeck,
      addCardsToDeck,
      goToDeck,
      startStudyForDeck,
      startQuickStudy,
    }),
    [user, decks, cards, onLogout, createDeck, deleteDeck, addCardsToDeck, goToDeck, startStudyForDeck, startQuickStudy]
  );

  return (
    <DashboardWorkspaceContext.Provider value={value}>
      {children}
    </DashboardWorkspaceContext.Provider>
  );
};

export function useDashboardWorkspace(): DashboardWorkspaceValue {
  const ctx = useContext(DashboardWorkspaceContext);
  if (!ctx) {
    throw new Error('useDashboardWorkspace must be used within DashboardWorkspaceProvider');
  }
  return ctx;
}



