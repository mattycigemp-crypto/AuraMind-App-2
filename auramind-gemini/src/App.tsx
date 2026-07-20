import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Deck, Card, Rating, UserProfile, UserRole } from "./types";
import { calculateSRS, getInitialCardState } from "./services/study/srs";
import { generateDeckFromTopic, GeneratedCard } from "./services/api/groqService";
import { dbService } from "./services/database/dbService";
import {
  createMetadataTemplates,
  mergeCardMetadata,
  persistCardMetadata,
} from "./services/study/roadmapService";
import { syncCurrentUser } from "./services/database/syncUser";
import { analyticsService } from "./services/analytics/analyticsService";
import { getPermissions, getDefaultRole, isCeoOrHigher, isOwnerOnly } from "./utils/permissions";
import { DashboardWorkspaceProvider } from "./contexts/DashboardWorkspaceContext";
import { addNotification } from "./services/notifications/notificationStore";

import { checkReducedMotion } from "./styles/animations/awe";
import {
  dashboardPathToSection,
  getPageTransitionVariant,
  isMarketingRoute,
  type PageTransitionVariant,
  supportsViewTransitions,
} from "./lib/motion";
import "./styles/design-tokens.css";
// import './i18n/config';

// Polyfill for requestIdleCallback (not supported in Safari and older mobile browsers)
if (typeof window !== "undefined" && !window.requestIdleCallback) {
  window.requestIdleCallback = function (
    callback: IdleRequestCallback,
    options?: { timeout?: number },
  ) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, options?.timeout || 1) as unknown as number;
  };
  window.cancelIdleCallback = function (id: number) {
    clearTimeout(id);
  };
}

import { LayoutProvider } from "./contexts/LayoutContext";
import { AchievementProvider } from "./components/achievements/AchievementUnlock";

const AmbientPlayer = React.lazy(() => import("./components/shared/AmbientPlayer"));
import HmrRefreshNotice from "./components/shared/HmrRefreshNotice";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { KeyboardAware } from "./components/shared/KeyboardAware";
import QuizGenerationNotifier from "./components/notifications/QuizGenerationNotifier";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { supabase } from "./services/database/supabase";
import { CommandPalette } from "./components/auramind/CommandPalette";
import { CinematicLoader } from "./components/ui/CinematicLoader";
import { CustomCursor } from "./components/ui/CustomCursor";

// Lazy-loaded route pages
const AuraLandingPage = React.lazy(() => import("./components/landing/ModernLandingPage"));
const AuraMindComplete = React.lazy(() => import("./pages/AuraMindComplete"));
const AuthPage = React.lazy(() => import("./components/auth/AuthPage"));
const DeckDetailRoute = React.lazy(() => import("./pages/deck/DeckDetailRoute"));
const StudyModeRoute = React.lazy(() => import("./pages/study/StudyModePage"));
const DocsPage = React.lazy(() => import("./pages/legal/DocsPage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("./pages/legal/TermsOfServicePage"));
const ResetPasswordPage = React.lazy(() => import("./pages/auth/ResetPasswordPage"));
const RestoreAccountPage = React.lazy(() => import("./pages/auth/RestoreAccountPage"));
const CallbackPage = React.lazy(() => import("./pages/auth/CallbackPage"));
const SchoologyCallbackPage = React.lazy(() => import("./pages/auth/SchoologyCallbackPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const PaymentPage = React.lazy(() => import("./components/auth/PaymentPage"));
const DownloadPage = React.lazy(() => import("./pages/DownloadPage"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const AIChatPage = React.lazy(() => import("./components/chat/AIChatPage"));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage"));
const AnalyticsPage = React.lazy(() => import("./pages/dashboard/AnalyticsPage"));
const AchievementsPage = React.lazy(() => import("./pages/dashboard/AchievementsPage"));
const LeaderboardPage = React.lazy(() => import("./pages/dashboard/LeaderboardPage"));
const HealthCheckPage = React.lazy(() => import("./pages/admin/HealthCheckPage"));
const AdminOverview = React.lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = React.lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminTestUsers = React.lazy(() => import("./pages/admin/AdminTestUsers"));
const AdminContent = React.lazy(() => import("./pages/admin/AdminContent"));
const AdminPlatformPreview = React.lazy(() => import("./pages/admin/AdminPlatformPreview"));
const AdminNexusPage = React.lazy(() => import("./pages/admin/AdminNexusPage"));
const AdminFeatureFlags = React.lazy(() => import("./pages/admin/AdminFeatureFlags"));
const AdminRoles = React.lazy(() => import("./pages/admin/AdminRoles"));
const AuditLog = React.lazy(() => import("./pages/admin/AuditLog"));
const DatabaseExplorer = React.lazy(() => import("./pages/admin/DatabaseExplorer"));
const AdminAnalytics = React.lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));

// Icons
import {
  ArrowDownIcon as ArrowDown,
  BrainCircuitIcon as BrainCircuit,
} from "./components/icons/CustomIcons";

// --- PREMIUM COMPONENTS ---

const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] bg-arch-bg flex flex-col items-center justify-center p-6 text-center"
  >
    {/* Background Depth */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/[0.02] blur-[100px] rounded-full animate-pulse" />
    </div>

    <div className="relative flex flex-col items-center gap-10">
      <div className="w-24 h-24 rounded-[32px] bg-zinc-900/[0.02] border border-zinc-700/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.02)] relative group">
        <div className="absolute inset-0 bg-zinc-900/10 rounded-full blur-2xl opacity-50 animate-pulse" />
        <BrainCircuit size={40} className="text-white relative z-10" />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.6em] text-white/40 italic">
          AuraMind Neural Link
        </h2>
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                height: [4, 12, 4],
                opacity: [0.1, 1, 0.1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-[3px] bg-zinc-300 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-32 md:bottom-10 right-10 w-16 h-16 border border-border bg-background/80 text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-50 group backdrop-blur-xl rounded-[20px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
        >
          <ArrowDown
            size={20}
            className="rotate-180 group-hover:-translate-y-1 transition-transform"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({
  user,
  status,
  onLogout,
  useLayout = true,
  children,
}: {
  user: UserProfile | null;
  status: "active" | "trialing" | "canceled" | "past_due" | "none" | "loading";
  onLogout: () => void;
  useLayout?: boolean;
  children?: React.ReactNode;
}) => {
  if (status === "loading") {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 1. Force verification if not confirmed
  if (!user.isEmailVerified && !user.isPhoneVerified) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Force payment if not active/trialing (Admins already set to 'active')
  if (status !== "active" && status !== "trialing") {
    return <Navigate to="/subscribe" replace />;
  }

  if (useLayout) {
    return <div className="min-h-screen bg-zinc-950">{children ?? <Outlet />}</div>;
  }

  return <Outlet />;
};

const PageTransition = ({
  children,
  variant = "full",
}: {
  children: React.ReactNode;
  variant?: PageTransitionVariant;
}) => {
  if (variant === "none" || checkReducedMotion()) {
    return <div className="min-h-screen relative">{children}</div>;
  }

  if (variant === "lite") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
        className="min-h-screen relative"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
      }}
      exit={{
        opacity: 0,
        y: -8,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
      }}
      className="min-h-screen gpu-accelerated relative"
    >
      {children}
    </motion.div>
  );
};

type DashboardShellProps = {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  createDeck: (title: string, description: string) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<void>;
  addCardsToDeck: (deckId: string, newCards: any[]) => Promise<number | undefined>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
};

const DashboardShell = ({
  user,
  decks,
  cards,
  createDeck,
  deleteDeck,
  addCardsToDeck,
  updateProfile,
  onLogout,
}: DashboardShellProps) => {
  const location = useLocation();
  const initialPage = dashboardPathToSection(location.pathname);

  return (
    <AuraMindComplete
      user={user}
      decks={decks}
      cards={cards}
      createDeck={createDeck}
      deleteDeck={deleteDeck}
      addCardsToDeck={addCardsToDeck}
      updateProfile={updateProfile}
      onLogout={onLogout}
      initialPage={initialPage}
    />
  );
};

const AppContent = ({ onUserRoleChange }: { onUserRoleChange: (role: UserRole) => void }) => {
  const location = useLocation();
  const transitionVariant = getPageTransitionVariant(location.pathname);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "active" | "trialing" | "canceled" | "past_due" | "none" | "loading"
  >("loading");
  const [showAmbientPlayer, setShowAmbientPlayer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    analyticsService.init().catch(() => {});
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/dashboard")) {
      setShowAmbientPlayer(false);
      return;
    }

    const idleId = window.requestIdleCallback(() => setShowAmbientPlayer(true), { timeout: 2500 });

    return () => window.cancelIdleCallback(idleId);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMarketingRoute(location.pathname) || isMobile || checkReducedMotion()) {
      return;
    }

    let cancelled = false;

    const initMarketingMotion = async () => {
      const [{ initializeAweSystem }, { initializeScrollAnimations }] = await Promise.all([
        import("./styles/animations/awe"),
        import("./hooks/useScrollAnimations"),
      ]);

      if (cancelled) return;

      window.requestIdleCallback(() => {
        if (cancelled) return;
        initializeAweSystem();
        initializeScrollAnimations();
      });
    };

    initMarketingMotion();

    return () => {
      cancelled = true;
      import("./hooks/useScrollAnimations").then(({ cleanupScrollAnimations }) => {
        cleanupScrollAnimations();
      });
    };
  }, [location.pathname, isMobile]);

  const checkSubscription = async (userId: string, email: string, forceCheck = false) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        console.error("Subscription check failed:", response.status, response.statusText);
        setSubscriptionStatus("none");
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Subscription check failed: Expected JSON, got", contentType);
        setSubscriptionStatus("none");
        return;
      }

      const data = await response.json();
      
      // If URL has ?payment=success, user just returned from Stripe — retry
      // up to 3 times over 6 seconds in case the webhook hasn't fired yet
      if (forceCheck && data.status !== 'active' && data.status !== 'trialing') {
        setSubscriptionStatus("loading");
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise(r => setTimeout(r, 2000));
          const retryRes = await fetch(`${apiBase}/api/subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, email }),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.status === 'active' || retryData.status === 'trialing') {
              setSubscriptionStatus(retryData.status);
              // Clean up the URL so future refreshes don't retry unnecessarily
              const url = new URL(window.location.href);
              url.searchParams.delete('payment');
              window.history.replaceState({}, '', url.toString());
              return;
            }
          }
        }
        // All retries failed — fall through to use original status
      }
      
      // Clean up query param if check passed on first try
      if (forceCheck && (data.status === 'active' || data.status === 'trialing')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        window.history.replaceState({}, '', url.toString());
      }
      
      setSubscriptionStatus(data.status || "none");
    } catch (err) {
      console.error("Subscription check failed:", err);
      setSubscriptionStatus("none");
    }
  };

  const mapAuthUserToProfile = (authUser: any): UserProfile => {
    const metadata = authUser.user_metadata || {};
    const role = (metadata.role as UserRole) || getDefaultRole(authUser.email);
    const permissions = getPermissions(role);

    // Update role in parent component
    onUserRoleChange(role);

    return {
      id: authUser.id,
      name: metadata.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || "",
      avatar: metadata.avatar_url,
      plan: metadata.plan || "Starter",
      streak: typeof metadata.streak === "number" ? metadata.streak : 0,
      streakFreezes: typeof metadata.streak_freezes === "number" ? metadata.streak_freezes : 2,
      joinedDate: metadata.joined_date ? Number(metadata.joined_date) : Date.now(),
      isAdmin: permissions.canAccessAdminPanel,
      role: role,
      isEmailVerified: !!authUser.email_confirmed_at,
      isPhoneVerified: !!authUser.phone_confirmed_at,
      phone: authUser.phone || "",
      lastStudyDate: metadata.last_study_date,
    };
  };

  useEffect(() => {
    const syncSession = async (session: any) => {
      try {
        if (!session?.user) {
          setUser(null);
          setDecks([]);
          setCards([]);
          setActiveDeckId(null);
          setSubscriptionStatus("none");
          analyticsService.reset().catch(() => {});
          return;
        }

        const profile = mapAuthUserToProfile(session.user);
        setUser(profile);
        analyticsService
          .identify(profile.id, { email: profile.email, plan: profile.plan })
          .catch(() => {});

        const permissions = getPermissions(profile.role || UserRole.USER);
        if (permissions.hasFreeAccess) {
          setSubscriptionStatus("active");
        } else {
          await checkSubscription(
            session.user.id,
            session.user.email || "",
            window.location.search.includes('payment=success'),
          );
        }

        await syncCurrentUser();

        const [fetchedDecks, fetchedCards] = await Promise.all([
          dbService.fetchDecks(session.user.id),
          dbService.fetchCards(session.user.id),
        ]);

        setDecks(fetchedDecks);
        setCards(fetchedCards);
      } catch (err) {
        console.error("Failed to sync session:", err);
      }
    };

    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
          syncSession(session);
        }
      });
      subscription = sub;
    } else {
      console.warn("Supabase not initialized - authentication disabled");
    }

    supabase?.auth
      .getSession()
      .then(({ data: { session } }) => {
        syncSession(session);
      })
      .catch((err) => console.error("Failed to get session:", err));

    return () => subscription?.unsubscribe();
  }, []);

  const createDeck = async (t: string, d: string) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, t, d);
    setDecks((prev) => [...prev, deck]);
    addNotification({
      title: 'Deck Created',
      description: `"${t}" is ready for study`,
      type: 'success',
      actionUrl: `/deck/${deck.id}`,
      actionLabel: 'Open Deck',
    });
    return deck;
  };

  const loadDecks = async () => {
    if (!user) return;
    const [fetchedDecks, fetchedCards] = await Promise.all([
      dbService.fetchDecks(user.id),
      dbService.fetchCards(user.id),
    ]);
    setDecks(fetchedDecks);
    setCards(fetchedCards);
  };

  // Invalidate cache after deck deletion to ensure fresh data
  const invalidateDeckCache = () => {
    dbService.clearCache();
  };

  const saveDeckWithCards = async (
    title: string,
    description: string,
    cardsToSave: GeneratedCard[],
    sourceLabel: string,
    sourceType: Card["sourceType"] = "manual",
  ) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, title, description);
    const seededCards = cardsToSave.map((card) =>
      getInitialCardState(
        deck.id,
        (card as any).front || card.question,
        (card as any).back || card.answer,
      ),
    );
    const cardsWithMetadata = cardsToSave.map((card) => ({
      front: (card as any).front || card.question,
      back: (card as any).back || card.answer,
      citations: [],
      sourceLabel,
      sourceType,
    }));
    const templates = createMetadataTemplates(cardsWithMetadata as any, sourceLabel, sourceType);
    const savedCards = mergeCardMetadata(
      await dbService.saveCards(user.id, seededCards),
      templates,
    );
    persistCardMetadata(savedCards);
    // Skip deck update since cardCount column doesn't exist in database
    // await dbService.updateDeck(deck.id, { cardCount: savedCards.length });
    const hydratedDeck = { ...deck, cardCount: savedCards.length, sourceLabel };
    setDecks((prev) => [...prev, hydratedDeck]);
    setCards((prev) => [...prev, ...savedCards]);
    return { deckId: hydratedDeck.id, deckTitle: hydratedDeck.title, cardCount: savedCards.length };
  };

  const deleteDeck = async (id: string) => {
    try {
      await dbService.deleteDeck(id);
      invalidateDeckCache();
      setDecks((prev) => prev.filter((d) => d.id !== id));
      setCards((prev) => prev.filter((c) => c.deckId !== id));
    } catch (err) {
      console.error("Failed to delete deck:", err);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    const targetCard = cards.find((card) => card.id === id);
    await dbService.deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (targetCard) {
      setDecks((prev) =>
        prev.map((deck) =>
          deck.id === targetCard.deckId
            ? { ...deck, cardCount: Math.max(0, deck.cardCount - 1) }
            : deck,
        ),
      );
    }
  };

  const rateCard = async (id: string, rating: Rating) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const res = calculateSRS(card, rating);
    const updates: any = {
      interval: res.interval,
      repetition: res.repetition,
      easeFactor: res.easeFactor,
      nextReview: Date.now() + res.interval * 86400000,
      lastReviewed: Date.now(),
    };
    // Save FSRS state if available
    if ((res as any).fsrsState) {
      updates.fsrsState = (res as any).fsrsState;
    }
    await dbService.updateCard(id, updates);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      if (user.lastStudyDate !== today) {
        const previous = user.lastStudyDate ? new Date(`${user.lastStudyDate}T00:00:00`) : null;
        const current = new Date(`${today}T00:00:00`);
        const diffDays = previous
          ? Math.round((current.getTime() - previous.getTime()) / 86400000)
          : 0;

        let nextStreak = user.streak || 0;
        let nextFreezes = user.streakFreezes ?? 2;

        if (diffDays === 1) {
          nextStreak += 1;
        } else if (diffDays > 1) {
          const missedDays = diffDays - 1;
          if (nextFreezes >= missedDays) {
            nextFreezes -= missedDays;
            nextStreak += 1;
          } else {
            nextStreak = 1;
          }
        } else {
          nextStreak = nextStreak === 0 ? 1 : nextStreak;
        }

        await updateUserProfile({
          streak: nextStreak,
          streakFreezes: nextFreezes,
          lastStudyDate: today,
        });

        // Dispatch streak milestone notifications
        const milestones = [3, 7, 14, 30, 50, 100, 200, 365];
        if (milestones.includes(nextStreak)) {
          addNotification({
            title: `${nextStreak}-Day Streak! 🔥`,
            description: 'Amazing consistency — keep the momentum going',
            type: 'success',
            actionUrl: '/dashboard/achievements',
            actionLabel: 'View Achievements',
          });
        }
      }
    }
  };

  const saveCard = async (card: any) => {
    if (!user) return;
    const templates = createMetadataTemplates([card], "Manual entry", "manual");
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, [card]), templates);
    persistCardMetadata(saved);
    setCards((prev) => [...prev, ...saved]);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === card.deckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck,
      ),
    );
  };

  const saveGeneratedCards = async (newOnes: any[]) => {
    if (!activeDeckId || !user) return;
    const s = newOnes.map((c) => getInitialCardState(activeDeckId, c.question, c.answer));
    const templates = createMetadataTemplates(newOnes, "Aura Operator session", "ai");
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, s), templates);
    persistCardMetadata(saved);
    setCards((prev) => [...prev, ...saved]);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === activeDeckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck,
      ),
    );
  };

  const addCardsToDeck = async (deckId: string, newCards: any[]) => {
    if (!user) return;
    const s = newCards.map((c) =>
      getInitialCardState(deckId, c.front || c.question, c.back || c.answer),
    );
    const templates = createMetadataTemplates(newCards, "AuraMind AI", "ai");
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, s), templates);
    persistCardMetadata(saved);
    setCards((prev) => [...prev, ...saved]);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === deckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck,
      ),
    );
    return saved.length;
  };

  const createGeneratedDeck = async (topic: string) => {
    const generated = await generateDeckFromTopic(topic);
    const created = await saveDeckWithCards(
      generated.title,
      generated.description,
      generated.cards,
      `AuraMind AI research • ${topic}`,
      "research",
    );
    return created ? { deckTitle: created.deckTitle, cardCount: created.cardCount } : null;
  };

  const createDeckFromCards = async (
    title: string,
    description: string,
    generatedCards: GeneratedCard[],
  ) => {
    return saveDeckWithCards(title, description, generatedCards, title, "ai");
  };

  const importDeckFromCards = async (
    title: string,
    description: string,
    importedCards: GeneratedCard[],
  ) => {
    return saveDeckWithCards(title, description, importedCards, title, "import");
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const nextProfile = { ...user, ...updates };
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: nextProfile.name,
        avatar_url: nextProfile.avatar,
        plan: nextProfile.plan,
        streak: nextProfile.streak,
        streak_freezes: nextProfile.streakFreezes,
        joined_date: nextProfile.joinedDate,
        is_admin: nextProfile.isAdmin ?? false,
        last_study_date: nextProfile.lastStudyDate,
      },
    });
    if (error) throw error;
    // Keep user_profiles table in sync for pages that read from it
    if (updates.name) {
      await supabase.from('user_profiles').update({ name: updates.name }).eq('id', user.id);
    }
    setUser(mapAuthUserToProfile(data.user ?? { ...user, user_metadata: {} }));
  };

  const currentUser = user || null;
  
  // Don't render admin routes or dashboard shell if user is not loaded
  if (!currentUser && location.pathname !== '/' && location.pathname !== '/auth' && !location.pathname.startsWith('/subscribe') && !location.pathname.startsWith('/docs') && !location.pathname.startsWith('/privacy') && !location.pathname.startsWith('/terms') && !location.pathname.startsWith('/download')) {
    return <LoadingOverlay />;
  }
  const onLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      <CinematicLoader />
      <CustomCursor />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#F0EFFE',
            border: '1px solid #2A2A3A',
            fontSize: '12px',
          },
        }}
      />
      <KeyboardAware>
      <CommandPalette />
      <AnimatePresence mode="sync">
        <Suspense fallback={<LoadingOverlay />}>
          <Routes location={location}>
            <Route
              path="/"
              element={
                <PageTransition variant={transitionVariant}>
                  <AuraLandingPage />
                </PageTransition>
              }
            />
            <Route
              path="/auth"
              element={
                <PageTransition>
                  <AuthPage />
                </PageTransition>
              }
            />
            <Route
              path="/subscribe"
              element={
                user && (subscriptionStatus === "active" || subscriptionStatus === "trialing") ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <PageTransition>
                    <PaymentPage
                      user={currentUser as any}
                      cancelled={window.location.search.includes('payment=cancelled')}
                    />
                  </PageTransition>
                )
              }
            />

            <Route
              element={
                <ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />
              }
            >
              <Route
                path="/deck/:id"
                element={
                  <PageTransition>
                    <DeckDetailRoute />
                  </PageTransition>
                }
              />
            </Route>

            {/* Admin: Vault / Overview */}
            <Route
              path="/admin/vault"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                const permissions = getPermissions(currentUser.role || UserRole.USER);
                return permissions.canAccessAdminPanel ? (
                  <PageTransition>
                    <DashboardWorkspaceProvider
                      user={currentUser}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      updateProfile={updateUserProfile}
                      onLogout={onLogout}
                    >
                      <AdminOverview />
                    </DashboardWorkspaceProvider>
                  </PageTransition>
                ) : (
                  <Navigate to="/dashboard" replace />
                );
              })()}
            />
            <Route
              path="/admin/health"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                const permissions = getPermissions(currentUser.role || UserRole.USER);
                return permissions.canAccessAdminPanel ? (
                  <PageTransition>
                    <DashboardWorkspaceProvider
                      user={currentUser}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      updateProfile={updateUserProfile}
                      onLogout={onLogout}
                    >
                      <HealthCheckPage />
                    </DashboardWorkspaceProvider>
                  </PageTransition>
                ) : (
                  <Navigate to="/dashboard" replace />
                );
              })()}
            />
            {/* CEO+: Nexus Command (classified features) */}
            <Route
              path="/admin/nexus"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!isCeoOrHigher(currentUser.role)) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminNexusPage /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Feature Flags */}
            <Route
              path="/admin/flags"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminFeatureFlags /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Database Explorer */}
            <Route
              path="/admin/database"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><DatabaseExplorer /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Audit Trail */}
            <Route
              path="/admin/audit"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AuditLog /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* CEO+: Revenue Dashboard */}
            <Route
              path="/admin/revenue"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!isCeoOrHigher(currentUser.role)) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminAnalytics /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* CEO+: System Config */}
            <Route
              path="/admin/config"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!isCeoOrHigher(currentUser.role)) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminSettings /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Owner: Role Manager */}
            <Route
              path="/admin/roles"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!isOwnerOnly(currentUser.role)) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminRoles /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: User Management */}
            <Route
              path="/admin/users"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminUsers /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Subscriptions */}
            <Route
              path="/admin/subscriptions"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminSubscriptions /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Test Users */}
            <Route
              path="/admin/test-users"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminTestUsers /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Content Library */}
            <Route
              path="/admin/content"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminContent /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            {/* Admin: Platform Preview */}
            <Route
              path="/admin/preview"
              element={(() => {
                if (!currentUser) return <Navigate to="/auth" replace />;
                if (!getPermissions(currentUser.role || UserRole.USER).canAccessAdminPanel) return <Navigate to="/dashboard" replace />;
                return <PageTransition><DashboardWorkspaceProvider user={currentUser} decks={decks} cards={cards} createDeck={createDeck} deleteDeck={deleteDeck} addCardsToDeck={addCardsToDeck} updateProfile={updateUserProfile} onLogout={onLogout}><AdminPlatformPreview /></DashboardWorkspaceProvider></PageTransition>;
              })()}
            />
            <Route
              path="/docs"
              element={
                <PageTransition>
                  <DocsPage />
                </PageTransition>
              }
            />
            <Route
              path="/privacy"
              element={
                <PageTransition>
                  <PrivacyPolicyPage />
                </PageTransition>
              }
            />
            <Route
              path="/terms"
              element={
                <PageTransition>
                  <TermsOfServicePage />
                </PageTransition>
              }
            />
            <Route
              path="/download"
              element={
                <PageTransition>
                  <DownloadPage />
                </PageTransition>
              }
            />

            <Route
              element={
                <ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />
              }
            >
              <Route
                path="/dashboard/analytics"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
                        <DashboardWorkspaceProvider
                          user={user}
                          decks={decks}
                          cards={cards}
                          createDeck={createDeck}
                          deleteDeck={deleteDeck}
                          addCardsToDeck={addCardsToDeck}
                          updateProfile={updateUserProfile}
                          onLogout={onLogout}
                        >
                          <AnalyticsPage />
                        </DashboardWorkspaceProvider>
                      </Suspense>
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard/leaderboard"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
                        <DashboardWorkspaceProvider
                          user={user}
                          decks={decks}
                          cards={cards}
                          createDeck={createDeck}
                          deleteDeck={deleteDeck}
                          addCardsToDeck={addCardsToDeck}
                          updateProfile={updateUserProfile}
                          onLogout={onLogout}
                        >
                          <LeaderboardPage />
                        </DashboardWorkspaceProvider>
                      </Suspense>
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard/achievements"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
                        <DashboardWorkspaceProvider
                          user={user}
                          decks={decks}
                          cards={cards}
                          createDeck={createDeck}
                          deleteDeck={deleteDeck}
                          addCardsToDeck={addCardsToDeck}
                          updateProfile={updateUserProfile}
                          onLogout={onLogout}
                        >
                          <AchievementsPage />
                        </DashboardWorkspaceProvider>
                      </Suspense>
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route path="/dashboard/quiz" element={<Navigate to="/dashboard/decks" replace />} />
              <Route path="/dashboard/planner" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/insights" element={<Navigate to="/dashboard/analytics" replace />} />
              <Route path="/dashboard/professor" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/progress" element={<Navigate to="/dashboard/analytics" replace />} />
              <Route
                path="/dashboard/onboarding"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <OnboardingPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard/chat"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
                        <DashboardWorkspaceProvider
                          user={user}
                          decks={decks}
                          cards={cards}
                          createDeck={createDeck}
                          deleteDeck={deleteDeck}
                          addCardsToDeck={addCardsToDeck}
                          updateProfile={updateUserProfile}
                          onLogout={onLogout}
                        >
                          <AIChatPage />
                        </DashboardWorkspaceProvider>
                      </Suspense>
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
                        <DashboardWorkspaceProvider
                          user={user}
                          decks={decks}
                          cards={cards}
                          createDeck={createDeck}
                          deleteDeck={deleteDeck}
                          addCardsToDeck={addCardsToDeck}
                          updateProfile={updateUserProfile}
                          onLogout={onLogout}
                        >
                          <SettingsPage />
                        </DashboardWorkspaceProvider>
                      </Suspense>
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <PageTransition variant="lite">
                    {user ? (
                      <DashboardShell
                        user={user}
                        decks={decks}
                        cards={cards}
                        createDeck={createDeck}
                        deleteDeck={deleteDeck}
                        addCardsToDeck={addCardsToDeck}
                        updateProfile={updateUserProfile}
                        onLogout={onLogout}
                      />
                    ) : (
                      <Navigate to="/auth" replace />
                    )}
                  </PageTransition>
                }
              />
              {/* Redirect old routes to new dashboard */}
              <Route path="/generate" element={<Navigate to="/dashboard/generator" replace />} />
              <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
              <Route path="/schedule" element={<Navigate to="/dashboard" replace />} />
              <Route path="/decks" element={<Navigate to="/dashboard/decks" replace />} />
              <Route path="/leaderboards" element={<Navigate to="/dashboard/leaderboard" replace />} />
              <Route path="/challenges" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route
              path="/study/:deckId"
              element={
                subscriptionStatus === "active" ||
                subscriptionStatus === "trialing" ||
                subscriptionStatus === "loading" ? (
                  <PageTransition variant="lite">
                    <StudyModeRoute />
                  </PageTransition>
                ) : (
                  <Navigate to="/subscribe" replace />
                )
              }
            />
            <Route
              path="/reset-password"
              element={
                <PageTransition>
                  <ResetPasswordPage />
                </PageTransition>
              }
            />
            <Route
              path="/restore-account"
              element={
                <PageTransition>
                  <RestoreAccountPage />
                </PageTransition>
              }
            />
            <Route
              path="/auth/callback"
              element={
                <PageTransition>
                  <CallbackPage />
                </PageTransition>
              }
            />
            <Route
              path="/auth/schoology/callback"
              element={
                <PageTransition>
                  <SchoologyCallbackPage />
                </PageTransition>
              }
            />
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFoundPage />
                </PageTransition>
              }
            />
          </Routes>
        </Suspense>
      </AnimatePresence>
      {showAmbientPlayer && (
        <Suspense fallback={null}>
          <AmbientPlayer />
        </Suspense>
      )}
      <ScrollTopButton />
      <HmrRefreshNotice />
      <QuizGenerationNotifier />
      </KeyboardAware>
    </div>
  );
};

const App = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LayoutProvider role={userRole}>
          <AchievementProvider>
            <AppContent onUserRoleChange={setUserRole} />
          </AchievementProvider>
        </LayoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
