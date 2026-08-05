import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, Outlet, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Deck, Card, Rating, UserProfile, UserRole } from "./types";
import { calculateSRS, getInitialCardState } from "./services/study/srs";
import type { GeneratedCard } from "./services/api/groqService";
import { dbService } from "./services/database/dbService";
import {
  createMetadataTemplates,
  mergeCardMetadata,
  persistCardMetadata,
} from "./services/study/roadmapService";
import { syncCurrentUser } from "./services/database/syncUser";
import { analyticsService } from "./services/analytics/analyticsService";
import { getPermissions, getDefaultRole } from "./utils/permissions";
import { addNotification } from "./services/notifications/notificationStore";
import { initRealtimeNotifications, destroyRealtimeNotifications } from "./services/notifications/realtimeNotifications";
import { checkReducedMotion } from "./styles/animations/awe";
import {
  getPageTransitionVariant,
  isMarketingRoute,
  type PageTransitionVariant,
  supportsViewTransitions,
} from "./lib/motion";
import "./styles/design-tokens.css";
import { LayoutProvider } from "./contexts/LayoutContext";
import { AchievementProvider } from "./components/achievements/AchievementUnlock";
import ReducedMotionGuard from "./components/shared/ReducedMotionGuard";
import StreakBurst from "./components/gamification/StreakBurst";
import Announcer from "./components/shared/Announcer";
import {
  AnalyticsSkeleton,
  GenericPageSkeleton,
} from "./components/shared/RouteSkeleton";
import { SkeletonProvider } from "./components/shared/SkeletonProvider";

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

function LegacyStudyRedirect() {
  const { deckId } = useParams<{ deckId: string }>();
  return <Navigate to={`/dashboard/study/${deckId || ''}`} replace />;
}

function milestoneCopy(days: number): string {
  switch (days) {
    case 3:   return 'Three days of momentum — your habit is forming.';
    case 7:   return 'One full week — the habit is locked.';
    case 14:  return 'Two weeks of daily review — recall is compounding.';
    case 30:  return 'A month in. Your future self thanks you.';
    case 50:  return 'Fifty days strong — you are in the top decile of learners.';
    case 100: return 'One hundred days. Triple-digit mastery.';
    case 200: return 'Two hundred days. This is who you are now.';
    case 365: return 'A full year of streaks. Legendary.';
    default:  return 'Keep going.';
  }
}

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

// ─────────────────────────────────────────────────────────────────────────
//  ROUTE-LEVEL LAZY IMPORTS
//
//  Two hubs own the authenticated product surface:
//   • NovaHub   — every /dashboard/* path (overview, tools, study, etc.)
// ─────────────────────────────────────────────────────────────────────────

const NovaHub   = React.lazy(() => import("./pages/dashboard/NovaHub"));

const AuraLandingPage      = React.lazy(() => import("./components/landing/ModernLandingPage"));
const IntegrationShowcase  = React.lazy(() => import("./pages/IntegrationShowcase"));
const AuthPage             = React.lazy(() => import("./components/auth/AuthPage"));
const DeckDetailRoute      = React.lazy(() => import("./pages/deck/DeckDetailRoute"));
const DocsPage             = React.lazy(() => import("./pages/legal/DocsPage"));
const PrivacyPolicyPage    = React.lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage   = React.lazy(() => import("./pages/legal/TermsOfServicePage"));
const AboutPage            = React.lazy(() => import("./pages/system/AboutPage"));
const ResetPasswordPage    = React.lazy(() => import("./pages/auth/ResetPasswordPage"));
const RestoreAccountPage   = React.lazy(() => import("./pages/auth/RestoreAccountPage"));
const CallbackPage         = React.lazy(() => import("./pages/auth/CallbackPage"));
const SchoologyCallbackPage = React.lazy(() => import("./pages/auth/SchoologyCallbackPage"));
const NotFoundPage         = React.lazy(() => import("./pages/NotFoundPage"));
const PaymentPage          = React.lazy(() => import("./components/auth/PaymentPage"));
const DownloadPage         = React.lazy(() => import("./pages/DownloadPage"));

import {
  ArrowDownIcon as ArrowDown,
  BrainCircuitIcon as BrainCircuit,
} from "./components/icons/CustomIcons";

const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] bg-arch-bg flex flex-col items-center justify-center p-6 text-center"
  >
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
              animate={{	height: [4, 12, 4], opacity: [0.1, 1, 0.1]}}
              transition={{duration: 1, repeat: Infinity, delay: i * 0.2}}
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
          aria-label="Scroll to top"
        >
          <ArrowDown size={20} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

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
  if (!user.isEmailVerified && !user.isPhoneVerified) {
    return <Navigate to="/auth" replace />;
  }
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
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const } }}
      className="min-h-screen gpu-accelerated relative"
    >
      {children}
    </motion.div>
  );
};

const StreakBurstMount = () => {
  const [streak, setStreak] = useState<number>(0);
  React.useEffect(() => {
    const onUpdate = (e: Event) => {
      const value = (e as CustomEvent<{ streak: number }>).detail?.streak;
      if (typeof value === "number") setStreak(value);
    };
    window.addEventListener("auraMind:streak", onUpdate as EventListener);
    return () => window.removeEventListener("auraMind:streak", onUpdate as EventListener);
  }, []);
  return <StreakBurst trigger={streak} />;
};

const AnnouncerMount = () => {
  const [msg, setMsg] = useState<string | null>(null);
  React.useEffect(() => {
    const onAnnounce = (e: Event) => {
      const text = (e as CustomEvent<{ message: string }>).detail?.message;
      if (typeof text === "string") setMsg(text);
    };
    window.addEventListener("auraMind:announce", onAnnounce as EventListener);
    return () => window.removeEventListener("auraMind:announce", onAnnounce as EventListener);
  }, []);
  return <Announcer message={msg} />;
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
    if (!user?.id) return;
    initRealtimeNotifications(user.id);
    return () => {
      destroyRealtimeNotifications();
    };
  }, [user?.id]);

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
        console.error("Subscription check failed:", response.status);
        setSubscriptionStatus("none");
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setSubscriptionStatus("none");
        return;
      }
      const data = await response.json();
      if (forceCheck && data.status !== "active" && data.status !== "trialing") {
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
            if (retryData.status === "active" || retryData.status === "trialing") {
              setSubscriptionStatus(retryData.status);
              const url = new URL(window.location.href);
              url.searchParams.delete("payment");
              window.history.replaceState({}, "", url.toString());
              return;
            }
          }
        }
      }
      if (forceCheck && (data.status === "active" || data.status === "trialing")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        window.history.replaceState({}, "", url.toString());
      }
      setSubscriptionStatus(data.status || "none");
    } catch (err) {
      console.error("Subscription check failed:", err);
      setSubscriptionStatus("none");
    }
  };

  const roleOf = useCallback((email?: string): UserRole => getDefaultRole(email), []);

  const mapAuthUserToProfile = useCallback((authUser: any): UserProfile => {
    const metadata = authUser.user_metadata || {};
    const role = (metadata.role as UserRole) || roleOf(authUser.email);
    const permissions = getPermissions(role);
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
      role,
      isEmailVerified: !!authUser.email_confirmed_at,
      isPhoneVerified: !!authUser.phone_confirmed_at,
      phone: authUser.phone || "",
      lastStudyDate: metadata.last_study_date,
    };
  }, [onUserRoleChange, roleOf]);

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
        let profile = mapAuthUserToProfile(session.user);
        try {
          const { data: dbProfile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const dbRole = dbProfile?.role as UserRole | undefined;
          if (dbRole) {
            const dbPerms = getPermissions(dbRole);
            const memPerms = getPermissions(profile.role || UserRole.USER);
            if (dbPerms.canAccessAdminPanel && !memPerms.canAccessAdminPanel) {
              profile = { ...profile, role: dbRole, isAdmin: true };
            }
          }
        } catch {
          // user_profiles not yet created — safe to ignore
        }
        setUser(profile);
        analyticsService.identify(profile.id, { email: profile.email, plan: profile.plan }).catch(() => {});

        const permissions = getPermissions(profile.role || UserRole.USER);
        if (permissions.hasFreeAccess) {
          setSubscriptionStatus("active");
        } else {
          await checkSubscription(
            session.user.id,
            session.user.email || "",
            window.location.search.includes("payment=success"),
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
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
          syncSession(session);
        }
      });
      subscription = sub;
    }
    supabase?.auth
      .getSession()
      .then(({ data: { session } }) => { syncSession(session); })
      .catch((err) => console.error("Failed to get session:", err));
    return () => subscription?.unsubscribe();
  }, [mapAuthUserToProfile]);

  const createDeck = useCallback(async (t: string, d: string) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, t, d);
    setDecks((prev) => [...prev, deck]);
    addNotification({
      title: "Deck Created",
      description: `"${t}" is ready for study`,
      type: "success",
      actionUrl: `/deck/${deck.id}`,
      actionLabel: "Open Deck",
    });
    return deck;
  }, [user]);

  const deleteDeck = useCallback(async (id: string) => {
    try {
      await dbService.deleteDeck(id);
      dbService.clearCache();
      setDecks((prev) => prev.filter((d) => d.id !== id));
      setCards((prev) => prev.filter((c) => c.deckId !== id));
    } catch (err) {
      console.error("Failed to delete deck:", err);
      throw err;
    }
  }, []);

  const addCardsToDeck = useCallback(async (deckId: string, newCards: any[]) => {
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
  }, [user]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const nextProfile = { ...user, ...updates };
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: nextProfile.name,
        avatar_url: nextProfile.avatar,
        plan: nextProfile.plan,
        role: nextProfile.role,
        streak: nextProfile.streak,
        streak_freezes: nextProfile.streakFreezes,
        joined_date: nextProfile.joinedDate,
        is_admin: nextProfile.isAdmin ?? false,
        last_study_date: nextProfile.lastStudyDate,
      },
    });
    if (error) throw error;
    if (updates.name) {
      await supabase.from("user_profiles").update({ name: updates.name }).eq("id", user.id);
    }
    setUser(mapAuthUserToProfile(data.user ?? { ...user, user_metadata: {} }));
  }, [user, mapAuthUserToProfile]);

  const currentUser = user || null;
  const onLogout = useCallback(() => { supabase.auth.signOut(); }, []);

  const workspaceProps = useMemo(
    () =>
      currentUser
        ? {
            user: currentUser,
            decks,
            cards,
            createDeck,
            deleteDeck,
            addCardsToDeck,
            updateProfile: updateUserProfile,
            onLogout,
          }
        : null,
    [currentUser, decks, cards, createDeck, deleteDeck, addCardsToDeck, updateUserProfile, onLogout],
  );

  if (!currentUser && location.pathname !== "/" && location.pathname !== "/auth"
      && !location.pathname.startsWith("/subscribe") && !location.pathname.startsWith("/docs")
      && !location.pathname.startsWith("/privacy") && !location.pathname.startsWith("/terms")
      && !location.pathname.startsWith("/download")) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      <CinematicLoader />
      <CustomCursor />
      <StreakBurstMount />
      <AnnouncerMount />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111118",
            color: "#F0EFFE",
            border: "1px solid #2A2A3A",
            fontSize: "12px",
          },
        }}
      />
      <KeyboardAware>
        <CommandPalette />
        <AnimatePresence mode="sync">
          <Suspense fallback={<LoadingOverlay />}>
            <Routes location={location}>
              {/* ───── Public routes ───────────────────────────────────────── */}
              <Route path="/" element={<PageTransition variant={transitionVariant}><AuraLandingPage /></PageTransition>} />
              <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
              <Route path="/showcase" element={<PageTransition><IntegrationShowcase /></PageTransition>} />

              <Route
                path="/subscribe"
                element={
                  user && (subscriptionStatus === "active" || subscriptionStatus === "trialing") ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <PageTransition>
                      <PaymentPage user={currentUser as any} cancelled={window.location.search.includes("payment=cancelled")} />
                    </PageTransition>
                  )
                }
              />

              <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
              <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
              <Route path="/download" element={<PageTransition><DownloadPage /></PageTransition>} />
              <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />

              {/* ───── Deck detail (standalone) ───────────────────────────── */}
              <Route element={<ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />}>
                <Route path="/deck/:id" element={<PageTransition><DeckDetailRoute /></PageTransition>} />
              </Route>

              {/* ───── /dashboard/* — NovaHub owns every sub-route ─────────── */}
              <Route element={<ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />}>
                <Route
                  path="/dashboard/*"
                  element={
                    <PageTransition variant="lite">
                      <SkeletonProvider skeleton="dashboard">
                        <Suspense fallback={<GenericPageSkeleton />}>
                          {workspaceProps ? (
                            <NovaHub
                              user={workspaceProps.user}
                              decks={workspaceProps.decks}
                              cards={workspaceProps.cards}
                              createDeck={workspaceProps.createDeck}
                              deleteDeck={workspaceProps.deleteDeck}
                              addCardsToDeck={workspaceProps.addCardsToDeck}
                              updateProfile={workspaceProps.updateProfile}
                              onLogout={workspaceProps.onLogout}
                            />
                          ) : (
                            <GenericPageSkeleton />
                          )}
                        </Suspense>
                      </SkeletonProvider>
                    </PageTransition>
                  }
                />
              </Route>

              {/* ───── Auth callback / restore pages ────────────────────── */}
              <Route path="/study/:deckId" element={<LegacyStudyRedirect />} />
              <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
              <Route path="/restore-account" element={<PageTransition><RestoreAccountPage /></PageTransition>} />
              <Route path="/auth/callback" element={<PageTransition><CallbackPage /></PageTransition>} />
              <Route path="/auth/schoology/callback" element={<PageTransition><SchoologyCallbackPage /></PageTransition>} />

              {/* ───── 404 ──────────────────────────────────────────────── */}
              <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
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
        <ReducedMotionGuard>
          <LayoutProvider role={userRole}>
            <AchievementProvider>
              <AppContent onUserRoleChange={setUserRole} />
            </AchievementProvider>
          </LayoutProvider>
        </ReducedMotionGuard>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
