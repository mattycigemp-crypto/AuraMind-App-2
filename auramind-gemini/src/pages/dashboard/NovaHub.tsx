/**
 * NovaHub — the unified /dashboard entry point.
 *
 * Every /dashboard/* path renders inside NovaDashboardShell. Specialized
 * tools (chat, generator, quiz, settings, leagues, study runtime) are
 * nested here so navigation never leaves the Nova chrome.
 */
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { UserProfile, Deck, Card } from "../../types";
import { DashboardWorkspaceProvider } from "../../contexts/DashboardWorkspaceContext";
import { NovaDashboardShell } from "../../components/dashboard/nova/NovaDashboardShell";
import { NovaOverview } from "../../components/dashboard/nova/NovaOverview";
import { NovaLibrary } from "../../components/dashboard/nova/NovaLibrary";
import { NovaStudy } from "../../components/dashboard/nova/NovaStudy";
import { Shimmer } from "../../components/dashboard/nova/motion";

const AIChatPage = React.lazy(() => import("../../components/chat/AIChatPage"));
const GeneratorPage = React.lazy(() => import("../generator/GeneratorPage"));
const SettingsPage = React.lazy(() => import("../settings/SettingsPage"));
const StudyModeRoute = React.lazy(() => import("../study/StudyModePage"));
const StudyToolsRoute = React.lazy(() => import("../study/StudyToolsPage"));

export interface NovaHubProps {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  createDeck: (title: string, description: string) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<void>;
  addCardsToDeck: (deckId: string, newCards: any[]) => Promise<number | undefined>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
}

function LazyFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="h-40 overflow-hidden rounded-3xl bg-white/[0.04]">
        <Shimmer />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 overflow-hidden rounded-2xl bg-white/[0.04]">
            <Shimmer />
          </div>
        ))}
      </div>
    </div>
  );
}

const NovaHub: React.FC<NovaHubProps> = (props) => {
  const {
    user, decks, cards,
    createDeck, deleteDeck, addCardsToDeck,
    updateProfile, onLogout,
  } = props;

  return (
    <DashboardWorkspaceProvider
      user={user}
      decks={decks}
      cards={cards}
      createDeck={createDeck}
      deleteDeck={deleteDeck}
      addCardsToDeck={addCardsToDeck}
      updateProfile={updateProfile}
      onLogout={onLogout}
    >
      <NovaDashboardShell>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<NovaOverview />} />
            <Route path="/decks" element={<NovaLibrary />} />
            <Route path="/study" element={<NovaStudy />} />
            <Route path="/study/:deckId" element={<StudyModeRoute />} />
            <Route path="/chat" element={<AIChatPage />} />
            <Route path="/generator" element={<GeneratorPage />} />
            <Route path="/study-tools" element={<StudyToolsRoute />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </NovaDashboardShell>
    </DashboardWorkspaceProvider>
  );
};

export default NovaHub;