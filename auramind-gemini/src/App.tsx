import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Deck, Card, Rating, UserProfile, UserRole } from './types';
import { calculateSRS, getInitialCardState } from './services/study/srs';
import { generateDeckFromTopic, GeneratedCard } from './services/api/deepseekService';
import { dbService } from './services/database/dbService';
import { PREMADE_CARDS, PREMADE_DECKS } from './data/premadeContent';
import { createMetadataTemplates, mergeCardMetadata, persistCardMetadata } from './services/study/roadmapService';
import { analyticsService } from './services/analytics/analyticsService';
import { getPermissions, getDefaultRole } from './utils/permissions';

const AuraLandingPage = React.lazy(() => import('./components/landing/AuraLandingPage'));
const BentoDashboard = React.lazy(() => import('./components/dashboard/BentoDashboard'));
const AppLayout = React.lazy(() => import('./components/shared/AppLayout'));

const DashboardInsightsPage = React.lazy(() => import('./pages/dashboard/InsightsPage'));
const DashboardPlannerPage = React.lazy(() => import('./pages/dashboard/PlannerPage'));
const ProfessorDashboardPage = React.lazy(() => import('./pages/dashboard/ProfessorDashboardPage'));
const DeckDetailRoute = React.lazy(() => import('./pages/deck/DeckDetailPage'));
const GenerateCardsRoute = React.lazy(() => import('./pages/deck/GenerateCardsPage'));
const StudyModeRoute = React.lazy(() => import('./pages/study/StudyModePage'));
const ChatRoute = React.lazy(() => import('./pages/chat/ChatPage'));
const SettingsPage = React.lazy(() => import('./pages/auth/SettingsPage'));
const AdminConsolePage = React.lazy(() => import('./pages/auth/AdminConsolePage'));
const DocsPage = React.lazy(() => import('./pages/legal/DocsPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/legal/TermsOfServicePage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const RestoreAccountPage = React.lazy(() => import('./pages/auth/RestoreAccountPage'));
const CallbackPage = React.lazy(() => import('./pages/auth/CallbackPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

const PaymentPage = React.lazy(() => import('./components/auth/PaymentPage'));
const AuthPage = React.lazy(() => import('./components/auth/AuthPage'));

import AmbientPlayer from './components/shared/AmbientPlayer';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { supabase } from './services/database/supabase';

// Icons
import {
  Loader2, ArrowDown, BrainCircuit, Activity
} from 'lucide-react';

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
  onLogout 
}: { 
  user: UserProfile | null; 
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none' | 'loading';
  onLogout: () => void;
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

  return <AppLayout user={user} onLogout={onLogout} />;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -10 }} 
    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trialing' | 'canceled' | 'past_due' | 'none' | 'loading'>('loading');

  useEffect(() => {
    analyticsService.init();
  }, []);

  const checkSubscription = async (userId: string, email: string) => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
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
    
    return {
      id: authUser.id,
      name: metadata.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      avatar: metadata.avatar_url,
      plan: metadata.plan || 'Starter',
      streak: typeof metadata.streak === 'number' ? metadata.streak : 0,
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
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
        }
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
  }, [navigate]);

  const createDeck = async (t: string, d: string) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, t, d);
    setDecks(prev => [...prev, deck]);
    return deck;
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
    const seededCards = cardsToSave.map((card) => getInitialCardState(deck.id, card.question, card.answer));
    const cardsWithMetadata = cardsToSave.map(card => ({
      question: card.question,
      answer: card.answer,
      citations: [],
      sourceLabel,
      sourceType
    }));
    const templates = createMetadataTemplates(cardsWithMetadata, sourceLabel, sourceType);
    const savedCards = mergeCardMetadata(await dbService.saveCards(user.id, seededCards), templates);
    persistCardMetadata(savedCards);
    await dbService.updateDeck(deck.id, { cardCount: savedCards.length });
    const hydratedDeck = { ...deck, cardCount: savedCards.length, sourceLabel };
    setDecks((prev) => [...prev, hydratedDeck]);
    setCards((prev) => [...prev, ...savedCards]);
    return { deckId: hydratedDeck.id, deckTitle: hydratedDeck.title, cardCount: savedCards.length };
  };

  const deleteDeck = async (id: string) => {
    await dbService.deleteDeck(id);
    setDecks(prev => prev.filter(d => d.id !== id));
    setCards(prev => prev.filter(c => c.deckId !== id));
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
    const updates = { ...res, nextReview: Date.now() + res.interval * 86400000 };
    await dbService.updateCard(id, updates);
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      if (user.lastStudyDate !== today) {
        const previous = user.lastStudyDate ? new Date(`${user.lastStudyDate}T00:00:00`) : null;
        const current = new Date(`${today}T00:00:00`);
        const diffDays = previous ? Math.round((current.getTime() - previous.getTime()) / 86400000) : 0;
        const nextStreak = diffDays === 1 ? (user.streak || 0) + 1 : 1;
        await updateUserProfile({ streak: nextStreak, lastStudyDate: today });
      }
    }
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

    const existingTitles = new Set(decks.map((deck) => deck.title.toLowerCase()));
    const templateGroups = PREMADE_DECKS
      .filter((deck) => !existingTitles.has(deck.title.toLowerCase()))
      .map((deck) => ({
        deck,
        cards: PREMADE_CARDS.filter((card) => card.deckId === deck.id),
      }));

    for (const template of templateGroups) {
      await saveDeckWithCards(
        template.deck.title,
        template.deck.description,
        template.cards.map((card) => ({
          question: card.question,
          answer: card.answer,
          citations: card.citations,
          sourceLabel: card.sourceLabel,
          sourceType: card.sourceType,
        })),
        template.deck.sourceLabel || template.deck.title,
        'sample'
      );
    }
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
        joined_date: nextProfile.joinedDate,
        is_admin: nextProfile.isAdmin ?? false,
        last_study_date: nextProfile.lastStudyDate,
      }
    });
    if (error) throw error;
    setUser(mapAuthUserToProfile(data.user ?? { ...user, user_metadata: {} }));
  };

  const currentUser = user || { id: 'guest', name: 'Guest', email: '', plan: 'Starter', streak: 0, joinedDate: Date.now(), isAdmin: false, isEmailVerified: false, isPhoneVerified: false, lastStudyDate: undefined };
  const onLogout = () => { supabase.auth.signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      <Suspense fallback={<LoadingOverlay />}>
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<PageTransition><AuraLandingPage onGetStarted={(e) => navigate('/auth', { state: { email: e } })} /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage onBack={() => navigate('/')} onContinue={() => navigate('/dashboard')} /></PageTransition>} />
          <Route path="/subscribe" element={
            user && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
              ? <Navigate to="/dashboard" replace />
              : <PageTransition><PaymentPage user={currentUser as any} onBack={() => navigate('/')} /></PageTransition>
          } />
          
          <Route element={<ProtectedRoute user={user} status={subscriptionStatus} onLogout={onLogout} />}>
            <Route path="/dashboard" element={<PageTransition><BentoDashboard decks={decks} cards={cards} onCreateDeck={createDeck} onSelectDeck={(id)=>navigate(`/deck/${id}`)} onDeleteDeck={deleteDeck} onGenerateDeck={createGeneratedDeck} onImportDeck={importDeckFromCards} onLoadDemoData={loadSampleDecks} onNavigate={(v)=>navigate(v === 'AURA_CHAT' ? '/chat' : '/generate')} user={currentUser} /></PageTransition>} />
            <Route path="/dashboard/insights" element={<PageTransition><DashboardInsightsPage decks={decks} cards={cards} /></PageTransition>} />
            <Route path="/dashboard/planner" element={<PageTransition><DashboardPlannerPage decks={decks} cards={cards} /></PageTransition>} />
            <Route path="/dashboard/professor" element={<PageTransition><ProfessorDashboardPage decks={decks} cards={cards} user={currentUser} /></PageTransition>} />
            <Route path="/deck/:id" element={<PageTransition><DeckDetailRoute decks={decks} cards={cards} deleteCard={deleteCard} setActiveDeckId={setActiveDeckId} /></PageTransition>} />
            <Route path="/generate" element={<PageTransition><GenerateCardsRoute activeDeckId={activeDeckId} user={currentUser} saveGeneratedCards={saveGeneratedCards} /></PageTransition>} />
            <Route path="/chat" element={<PageTransition><ChatRoute createGeneratedDeck={createGeneratedDeck} createDeckFromCards={createDeckFromCards} user={currentUser} decks={decks} cards={cards} /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage user={currentUser} onUpdateUser={updateUserProfile} /></PageTransition>} />
            <Route path="/admin/vault" element={(() => {
              const permissions = getPermissions(currentUser.role || UserRole.USER);
              return permissions.canAccessAdminPanel ? (
                <PageTransition><AdminConsolePage decks={decks} cards={cards} user={currentUser} /></PageTransition>
              ) : (
                <Navigate to="/dashboard" replace />
              );
            })()} />
            <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          </Route>

          <Route path="/study/:deckId" element={
            subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'loading'
              ? <PageTransition><StudyModeRoute decks={decks} cards={cards} navigate={navigate} setActiveDeckId={setActiveDeckId} rateCard={rateCard} /></PageTransition>
              : <Navigate to="/subscribe" replace />
          } />
          <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
          <Route path="/restore-account" element={<PageTransition><RestoreAccountPage /></PageTransition>} />
          <Route path="/auth/callback" element={<PageTransition><CallbackPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      </Suspense>
      {location.pathname.startsWith('/dashboard') && <AmbientPlayer />}
      <ScrollTopButton />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
