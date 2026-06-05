import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { Deck, Card, Rating, UserProfile, UserRole } from './types';
import { calculateSRS, getInitialCardState } from './services/study/srs';
import { generateDeckFromTopic, GeneratedCard } from './services/api/groqService';
import { dbService } from './services/database/dbService';
import { createMetadataTemplates, mergeCardMetadata, persistCardMetadata } from './services/study/roadmapService';
import { syncCurrentUser } from './services/database/syncUser';
import { analyticsService } from './services/analytics/analyticsService';
import { getPermissions, getDefaultRole } from './utils/permissions';
import { userService } from './services/api';

// The Engineering of Awe: Elite Animation System
import { initializeAweSystem, EASING_PRESETS, SPRING_PRESETS, checkReducedMotion } from './styles/animations/awe';
import { useScrollAnimations } from './hooks/useScrollAnimations';
import { useMagneticButton } from './hooks/useMagneticButton';
import './styles/design-tokens.css';
// import './i18n/config';

// Polyfill for requestIdleCallback (not supported in Safari and older mobile browsers)
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = function(callback: IdleRequestCallback, options?: { timeout?: number }) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, options?.timeout || 1) as unknown as number;
  };
  window.cancelIdleCallback = function(id: number) {
    clearTimeout(id);
  };
}

import { LayoutProvider } from './contexts/LayoutContext';
import { AchievementProvider } from './components/achievements/AchievementUnlock';
import QuizGenerationNotifier from './components/notifications/QuizGenerationNotifier';
import AmbientPlayer from './components/shared/AmbientPlayer';
import HmrRefreshNotice from './components/shared/HmrRefreshNotice';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { supabase } from './services/database/supabase';

// Lazy-loaded route pages
const AuraLandingPage = React.lazy(() => import('./components/landing/ModernLandingPage'));
const AuraMindComplete = React.lazy(() => import('./pages/AuraMindComplete'));
const SimplePage = React.lazy(() => import('./pages/SimplePage'));
const BrightDashboard = React.lazy(() => import('./pages/BrightDashboard'));
const WorkingDashboard = React.lazy(() => import('./pages/WorkingDashboard'));
const AuthPage = React.lazy(() => import('./components/auth/AuthPage'));
const DeckDetailRoute = React.lazy(() => import('./pages/deck/DeckDetailRoute'));
const StudyModeRoute = React.lazy(() => import('./pages/study/StudyModePage'));
const AdminConsolePage = React.lazy(() => import('./pages/auth/AdminConsolePage'));
const DocsPage = React.lazy(() => import('./pages/legal/DocsPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/legal/TermsOfServicePage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const RestoreAccountPage = React.lazy(() => import('./pages/auth/RestoreAccountPage'));
const CallbackPage = React.lazy(() => import('./pages/auth/CallbackPage'));
const SchoologyCallbackPage = React.lazy(() => import('./pages/auth/SchoologyCallbackPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const PaymentPage = React.lazy(() => import('./components/auth/PaymentPage'));
const DownloadPage = React.lazy(() => import('./pages/DownloadPage'));

// Icons
import {
  ArrowDownIcon as ArrowDown, BrainCircuitIcon as BrainCircuit
} from './components/icons/CustomIcons';

// --- PREMIUM COMPONENTS ---

const LoadingOverlay = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] bg-arch-bg flex flex-col items-center justify-center p-6 text-center"
  >
    {/* Background Depth */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] blur-[100px] rounded-full animate-pulse" />
    </div>

    <div className="relative flex flex-col items-center gap-10">
      <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.02)] relative group">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl opacity-50 animate-pulse" />
        <BrainCircuit size={40} className="text-white relative z-10" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.6em] text-white/40 italic">AuraMind Neural Link</h2>
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div 
              key={i}
              animate={{ 
                height: [4, 12, 4],
                opacity: [0.1, 1, 0.1]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-[3px] bg-white rounded-full"
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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-10 right-10 w-16 h-16 border border-white/10 bg-white/[0.02] text-white/40 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all z-50 group backdrop-blur-xl rounded-[20px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
        >
          <ArrowDown size={20} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
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
  children
}: { 
  user: UserProfile | null; 
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none' | 'loading';
  onLogout: () => void;
  useLayout?: boolean;
  children?: React.ReactNode;
}) => {
  if (status === 'loading') {
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
  if (status !== 'active' && status !== 'trialing') {
    return <Navigate to="/subscribe" replace />;
  }

  if (useLayout) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {children ?? <Outlet />}
      </div>
    );
  }

  return <Outlet />;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  // Check for reduced motion preference
  const shouldReduceMotion = checkReducedMotion();
  
  const animationConfig = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
      }
    : {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1] as const
          }
        }, 
        exit: { 
          opacity: 0, 
          y: -20, 
          scale: 0.95,
          transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1] as const
          }
        }
      };

  return (
    <motion.div 
      {...animationConfig}
      className="min-h-screen gpu-accelerated relative"
    >
      {children}
    </motion.div>
  );
};

const AppContent = ({ onUserRoleChange }: { onUserRoleChange: (role: UserRole) => void }) => {
  const location = useLocation();
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trialing' | 'canceled' | 'past_due' | 'none' | 'loading'>('loading');
  const [isAweInitialized, setIsAweInitialized] = useState(false);

  // Initialize scroll animations at the top level (follows Rules of Hooks)
  const scrollAnimations = useScrollAnimations();

  // Detect mobile for performance optimization
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Skip heavy animation system on mobile
    if (isMobile) {
      setIsAweInitialized(true);
      return;
    }

    if (!isAweInitialized) {
      requestIdleCallback(() => {
        initializeAweSystem();
        setIsAweInitialized(true);
      });
    }

    // Initialize real analytics service with elite performance
    analyticsService.init();

    // Add performance monitoring (deferred)
    if (typeof window !== 'undefined') {
      requestIdleCallback(() => {
        const perfObserver = new PerformanceObserver(() => {});

        perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      });
    }
  }, [isAweInitialized, isMobile]);

  // Cleanup scroll animations on unmount
  useEffect(() => {
    return () => {
      scrollAnimations.cleanup();
    };
  }, [scrollAnimations]);

  const checkSubscription = async (userId: string, email: string) => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
      
      if (!response.ok) {
        console.error('Subscription check failed:', response.status, response.statusText);
        setSubscriptionStatus('none');
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Subscription check failed: Expected JSON, got', contentType);
        setSubscriptionStatus('none');
        return;
      }
      
      const data = await response.json();
      setSubscriptionStatus(data.status || 'none');
    } catch (err) {
      console.error('Subscription check failed:', err);
      setSubscriptionStatus('none');
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
      name: metadata.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      avatar: metadata.avatar_url,
      plan: metadata.plan || 'Starter',
      streak: typeof metadata.streak === 'number' ? metadata.streak : 0,
      streakFreezes: typeof metadata.streak_freezes === 'number' ? metadata.streak_freezes : 2,
      joinedDate: metadata.joined_date ? Number(metadata.joined_date) : Date.now(),
      isAdmin: permissions.canAccessAdminPanel,
      role: role,
      isEmailVerified: !!authUser.email_confirmed_at,
      isPhoneVerified: !!authUser.phone_confirmed_at,
      phone: authUser.phone || '',
      lastStudyDate: metadata.last_study_date,
    };
  };

  useEffect(() => {
    const syncSession = async (session: any) => {
      if (!session?.user) {
        setUser(null);
        setDecks([]);
        setCards([]);
        setActiveDeckId(null);
        setSubscriptionStatus('none');
        analyticsService.reset();
        return;
      }

      const profile = mapAuthUserToProfile(session.user);
      setUser(profile);
      analyticsService.identify(profile.id, { email: profile.email, plan: profile.plan });
      
      const permissions = getPermissions(profile.role || UserRole.USER);
      if (permissions.hasFreeAccess) {
        setSubscriptionStatus('active');
      } else {
        await checkSubscription(session.user.id, session.user.email || '');
      }

      // Ensure user is synced to database first
      await syncCurrentUser();
      
      const [fetchedDecks, fetchedCards] = await Promise.all([
        dbService.fetchDecks(session.user.id),
        dbService.fetchCards(session.user.id)
      ]);

      setDecks(fetchedDecks);
      setCards(fetchedCards);
    };

    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          syncSession(session);
        }
      });
      subscription = sub;
    } else {
      console.warn('Supabase not initialized - authentication disabled');
    }

    supabase?.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const createDeck = async (t: string, d: string) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, t, d);
    setDecks(prev => [...prev, deck]);
    return deck;
  };

  const loadDecks = async () => {
    if (!user) return;
    const [fetchedDecks, fetchedCards] = await Promise.all([
      dbService.fetchDecks(user.id),
      dbService.fetchCards(user.id)
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
    sourceType: Card['sourceType'] = 'manual'
  ) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, title, description);
    const seededCards = cardsToSave.map((card) => getInitialCardState(deck.id, (card as any).front || card.question, (card as any).back || card.answer));
    const cardsWithMetadata = cardsToSave.map(card => ({
      front: (card as any).front || card.question,
      back: (card as any).back || card.answer,
      citations: [],
      sourceLabel,
      sourceType
    }));
    const templates = createMetadataTemplates(cardsWithMetadata as any, sourceLabel, sourceType);
    const savedCards = mergeCardMetadata(await dbService.saveCards(user.id, seededCards), templates);
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
      setDecks(prev => prev.filter(d => d.id !== id));
      setCards(prev => prev.filter(c => c.deckId !== id));
    } catch (err) {
      console.error('Failed to delete deck:', err);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    const targetCard = cards.find((card) => card.id === id);
    await dbService.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
    if (targetCard) {
      setDecks(prev => prev.map((deck) => (
        deck.id === targetCard.deckId
          ? { ...deck, cardCount: Math.max(0, deck.cardCount - 1) }
          : deck
      )));
    }
  };

  const rateCard = async (id: string, rating: Rating) => {
    const card = cards.find(c => c.id === id);
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
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      if (user.lastStudyDate !== today) {
        const previous = user.lastStudyDate ? new Date(`${user.lastStudyDate}T00:00:00`) : null;
        const current = new Date(`${today}T00:00:00`);
        const diffDays = previous ? Math.round((current.getTime() - previous.getTime()) / 86400000) : 0;
        
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
        
        await updateUserProfile({ streak: nextStreak, streakFreezes: nextFreezes, lastStudyDate: today });
      }
    }
  };

  const saveCard = async (card: any) => {
    if (!user) return;
    const templates = createMetadataTemplates([card], 'Manual entry', 'manual');
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, [card]), templates);
    persistCardMetadata(saved);
    setCards(prev => [...prev, ...saved]);
    setDecks(prev => prev.map((deck) => (
      deck.id === card.deckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck
    )));
  };

  const saveGeneratedCards = async (newOnes: any[]) => {
    if (!activeDeckId || !user) return;
    const s = newOnes.map(c => getInitialCardState(activeDeckId, c.question, c.answer));
    const templates = createMetadataTemplates(newOnes, 'Aura Operator session', 'ai');
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, s), templates);
    persistCardMetadata(saved);
    setCards(prev => [...prev, ...saved]);
    setDecks(prev => prev.map((deck) => (
      deck.id === activeDeckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck
    )));
  };

  const addCardsToDeck = async (deckId: string, newCards: any[]) => {
    if (!user) return;
    const s = newCards.map(c => getInitialCardState(deckId, c.front || c.question, c.back || c.answer));
    const templates = createMetadataTemplates(newCards, 'AuraMind AI', 'ai');
    const saved = mergeCardMetadata(await dbService.saveCards(user.id, s), templates);
    persistCardMetadata(saved);
    setCards(prev => [...prev, ...saved]);
    setDecks(prev => prev.map((deck) => (
      deck.id === deckId ? { ...deck, cardCount: deck.cardCount + saved.length } : deck
    )));
    return saved.length;
  };

  const createGeneratedDeck = async (topic: string) => {
    const generated = await generateDeckFromTopic(topic);
    const created = await saveDeckWithCards(
      generated.title,
      generated.description,
      generated.cards,
      `AuraMind AI research • ${topic}`,
      'research'
    );
    return created ? { deckTitle: created.deckTitle, cardCount: created.cardCount } : null;
  };

  const createDeckFromCards = async (title: string, description: string, generatedCards: GeneratedCard[]) => {
    return saveDeckWithCards(title, description, generatedCards, title, 'ai');
  };

  const importDeckFromCards = async (title: string, description: string, importedCards: GeneratedCard[]) => {
    return saveDeckWithCards(title, description, importedCards, title, 'import');
  };

  const loadSampleDecks = async () => {
    if (!user) return;

    console.log('Sample decks loading disabled - using real database data only');
    // NO MOCK DATA - User will create their own real decks and cards
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
      }
    });
    if (error) throw error;
    setUser(mapAuthUserToProfile(data.user ?? { ...user, user_metadata: {} }));
  };

  const currentUser = user || { id: 'guest', name: 'Guest', email: '', plan: 'Starter', streak: 0, streakFreezes: 2, joinedDate: Date.now(), isAdmin: false, isEmailVerified: false, isPhoneVerified: false, lastStudyDate: undefined };
  const onLogout = () => { supabase.auth.signOut(); };

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingOverlay />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><AuraLandingPage /></PageTransition>} />
          <Route path="/simple" element={<PageTransition><SimplePage /></PageTransition>} />
          <Route path="/bright" element={<PageTransition><BrightDashboard /></PageTransition>} />
          <Route path="/working" element={<PageTransition><WorkingDashboard /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/subscribe" element={
            user && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
              ? <Navigate to="/dashboard" replace />
              : <PageTransition><PaymentPage user={currentUser as any} /></PageTransition>
          } />
          
          <Route element={<ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />}>
            <Route path="/deck/:id" element={<PageTransition><DeckDetailRoute /></PageTransition>} />
            <Route path="/admin/vault" element={(() => {
              const permissions = getPermissions(currentUser.role || UserRole.USER);
              return permissions.canAccessAdminPanel ? (
                <PageTransition><AdminConsolePage /></PageTransition>
              ) : (
                <Navigate to="/dashboard" replace />
              );
            })()} />
          </Route>
          <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          <Route path="/download" element={<PageTransition><DownloadPage /></PageTransition>} />

          <Route element={<ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />}>
            <Route
              path="/dashboard"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="main"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/decks"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="cards"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/chat"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="chat"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="analytics"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/quiz"
              element={<Navigate to="/dashboard/decks" replace />}
            />
            <Route
              path="/dashboard/generator"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="generator"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/paths"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="paths"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/tutorial"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="tutorial"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="admin"
                    />
                  ) : (
                    <Navigate to="/auth" replace />
                  )}
                </PageTransition>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <PageTransition>
                  {user ? (
                    <AuraMindComplete
                      user={user}
                      decks={decks}
                      cards={cards}
                      createDeck={createDeck}
                      deleteDeck={deleteDeck}
                      addCardsToDeck={addCardsToDeck}
                      onLogout={onLogout}
                      initialPage="settings"
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
            <Route path="/leaderboards" element={<Navigate to="/dashboard" replace />} />
            <Route path="/challenges" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/planner" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/insights" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/professor" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="/study/:deckId" element={
            subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'loading'
              ? <PageTransition><StudyModeRoute /></PageTransition>
              : <Navigate to="/subscribe" replace />
          } />
          <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
          <Route path="/restore-account" element={<PageTransition><RestoreAccountPage /></PageTransition>} />
          <Route path="/auth/callback" element={<PageTransition><CallbackPage /></PageTransition>} />
          <Route path="/auth/schoology/callback" element={<PageTransition><SchoologyCallbackPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
        </Routes>
        </Suspense>
      </AnimatePresence>
      {location.pathname.startsWith('/dashboard') && <AmbientPlayer />}
      <ScrollTopButton />
      <HmrRefreshNotice />
      <QuizGenerationNotifier />
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



