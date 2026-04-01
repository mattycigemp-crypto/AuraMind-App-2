import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Deck, Card, Rating, UserProfile } from './types';
import { calculateSRS, getInitialCardState } from './services/srs';
import { generateFlashcards, generateSpeech, generateSummaryFromTopic, transcribeAudio, generateDeckFromTopic, GeneratedCard } from './services/geminiService';
import { dbService } from './services/dbService';
import AuraLandingPage from './components/AuraLandingPage';
import BentoDashboard from './components/BentoDashboard';
import AppLayout from './components/AppLayout';
import AmbientPlayer from './components/AmbientPlayer';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { supabase } from './services/supabase';
import {
  DashboardInsightsPage,
  DashboardPlannerPage,
  DeckDetailRoute,
  GenerateCardsRoute,
  StudyModeRoute,
  ChatRoute,
  SettingsPage,
  AdminConsolePage,
  DocsPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  ResetPasswordPage,
  NotFoundPage
} from './components/Pages';

// Icons
import {
  BookOpen, Plus, BrainCircuit, ChevronLeft, Trash2,
  Volume2, Loader2, CheckCircle, Globe, Mic, Type,
  Sparkles, GraduationCap, Zap, ArrowRight, Sun, Moon,
  Layout, Layers, Command, Bot, ArrowDown, Check,
  ChevronDown, Clock, Infinity, ShieldCheck, ClipboardList,
  Gem, FlaskConical, LineChart, CalendarDays, Activity,
  Eye, EyeOff, Search, Settings, MoreVertical, LayoutGrid,
  CreditCard, User, LogOut, MessageCircle, Menu, X, Award
} from 'lucide-react';

// --- SHARED COMPONENTS ---

const SkeletonCard = () => (
  <div className="p-10 border border-arch-border architectural-panel animate-pulse bg-arch-fg/5 space-y-10 min-h-[320px]">
    <div className="flex justify-between">
      <div className="h-2 bg-arch-bg border border-arch-border w-1/4"></div>
    </div>
    <div className="space-y-6">
      <div className="h-10 bg-arch-bg border border-arch-border w-3/4"></div>
      <div className="h-4 bg-arch-bg border border-arch-border w-full"></div>
      <div className="h-4 bg-arch-bg border border-arch-border w-1/2"></div>
    </div>
  </div>
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
          className="fixed bottom-10 right-10 w-14 h-14 border border-arch-fg bg-arch-bg text-arch-fg flex items-center justify-center hover:bg-arch-fg hover:text-arch-bg transition-all z-50 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <ArrowDown size={20} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const DashboardWebGLBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    const vs = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
    const fs = `
      precision mediump float;
      uniform vec2 r; uniform float t; uniform float l;
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
        float s = 0.0;
        for(float i=0.0; i<3.0; i++) {
          vec2 p = uv + vec2(sin(t+i)*0.2, cos(t*0.8+i)*0.2);
          s += 0.1 / length(p);
        }
        vec3 col = l > 0.5 ? vec3(0.96) : vec3(0.0);
        col += l > 0.5 ? vec3(0.1, 0.3, 0.6) * s * 0.1 : vec3(0.2, 0.5, 0.9) * s * 0.3;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const rLoc = gl.getUniformLocation(program, 'r');
    const tLoc = gl.getUniformLocation(program, 't');
    const lLoc = gl.getUniformLocation(program, 'l');

    let raf: number;
    const render = (time: number) => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, time * 0.001);
      gl.uniform1f(lLoc, resolvedTheme === 'light' ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [resolvedTheme]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 opacity-40 pointer-events-none" />;
};

// --- AUTH PAGE ---
const AuthPage: React.FC<{ onBack: () => void; onContinue: () => void }> = ({ onBack, onContinue }) => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const prefills = location.state as { email?: string } | null;
    if (prefills?.email) {
      setEmail(prefills.email);
    }
  }, [location.state]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Manual Welcome Email Trigger (Bypass Supabase SMTP limits)
        if (data?.user) {
          try {
            fetch('/api/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: data.user.email, 
                name: email.split('@')[0] 
              })
            });
          } catch (e) {
            console.warn('Welcome API failed but signup succeeded:', e);
          }
        }
      }
      onContinue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg font-black relative overflow-hidden">
      <div className="fixed inset-0 arch-grid-overlay opacity-30 pointer-events-none" />
      <div className="architectural-panel p-10 w-full max-w-lg relative z-10 space-y-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-arch-muted transition-colors hover:text-arch-fg"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-tight italic text-arch-fg">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-arch-muted font-medium">
            {mode === 'login' ? 'Sign in to continue to AuraMind.' : 'Create your account to get started.'}
          </p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            className="w-full bg-arch-fg/5 border border-arch-border p-4 text-sm font-medium outline-none focus:border-arch-border-bold transition-all text-arch-fg placeholder:text-arch-muted" 
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full bg-arch-fg/5 border border-arch-border p-4 pr-14 text-sm font-medium outline-none focus:border-arch-border-bold transition-all text-arch-fg placeholder:text-arch-muted"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-arch-muted transition-colors hover:text-arch-fg"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="btn-arch w-full">
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button
          onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-center text-xs font-black uppercase tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
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

  const mapAuthUserToProfile = (authUser: any): UserProfile => {
    const metadata = authUser.user_metadata || {};

    return {
      id: authUser.id,
      name: metadata.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      avatar: metadata.avatar_url,
      plan: metadata.plan || 'Starter',
      streak: typeof metadata.streak === 'number' ? metadata.streak : 0,
      joinedDate: metadata.joined_date ? Number(metadata.joined_date) : Date.now(),
      isAdmin: metadata.is_admin ?? authUser.email === 'matty.cigemp@gmail.com'
    };
  };

  useEffect(() => {
    const syncSession = async (session: any) => {
      if (!session?.user) {
        setUser(null);
        setDecks([]);
        setCards([]);
        setActiveDeckId(null);
        return;
      }

      const profile = mapAuthUserToProfile(session.user);
      setUser(profile);

      const [fetchedDecks, fetchedCards] = await Promise.all([
        dbService.fetchDecks(session.user.id),
        dbService.fetchCards(session.user.id)
      ]);

      setDecks(fetchedDecks);
      setCards(fetchedCards);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createDeck = async (t: string, d: string) => {
    if (!user) return null;
    const deck = await dbService.createDeck(user.id, t, d);
    setDecks(prev => [...prev, deck]);
    return deck;
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
  };

  const saveGeneratedCards = async (newOnes: any[]) => {
    if (!activeDeckId || !user) return;
    const s = newOnes.map(c => getInitialCardState(activeDeckId, c.question, c.answer));
    const saved = await dbService.saveCards(user.id, s);
    setCards(prev => [...prev, ...saved]);
    setDecks(prev => prev.map((deck) => (
      deck.id === activeDeckId
        ? { ...deck, cardCount: deck.cardCount + saved.length }
        : deck
    )));
    await dbService.updateDeck(activeDeckId, {
      cardCount: cards.filter((card) => card.deckId === activeDeckId).length + saved.length
    });
  };

  const createGeneratedDeck = async (topic: string) => {
    if (!user) return null;
    const generated = await generateDeckFromTopic(topic);
    const deck = await dbService.createDeck(user.id, generated.title, generated.description);
    const seededCards = generated.cards.map((card) => getInitialCardState(deck.id, card.question, card.answer));
    const savedCards = await dbService.saveCards(user.id, seededCards);
    await dbService.updateDeck(deck.id, { cardCount: savedCards.length });
    const hydratedDeck = { ...deck, cardCount: savedCards.length };
    setDecks((prev) => [...prev, hydratedDeck]);
    setCards((prev) => [...prev, ...savedCards]);
    return { deckTitle: hydratedDeck.title, cardCount: savedCards.length };
  };

  const createDeckFromCards = async (title: string, description: string, generatedCards: GeneratedCard[]) => {
    if (!user) return null;

    const deck = await dbService.createDeck(user.id, title, description);
    const seededCards = generatedCards.map((card) => getInitialCardState(deck.id, card.question, card.answer));
    const savedCards = await dbService.saveCards(user.id, seededCards);
    await dbService.updateDeck(deck.id, { cardCount: savedCards.length });

    const hydratedDeck = { ...deck, cardCount: savedCards.length };
    setDecks((prev) => [...prev, hydratedDeck]);
    setCards((prev) => [...prev, ...savedCards]);
    return { deckId: hydratedDeck.id, deckTitle: hydratedDeck.title, cardCount: savedCards.length };
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
        is_admin: nextProfile.isAdmin ?? false
      }
    });

    if (error) {
      throw error;
    }

    setUser(mapAuthUserToProfile(data.user ?? { ...user, user_metadata: {} }));
  };

  const currentUser = user || { id: 'guest', name: 'Guest', email: '', plan: 'Starter', streak: 0, joinedDate: Date.now(), isAdmin: false };
  const onLogout = () => { supabase.auth.signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-arch-bg text-arch-fg font-sans selection:bg-accent-low">
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<PageTransition><AuraLandingPage onGetStarted={(e) => navigate('/auth', { state: { email: e } })} /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage onBack={() => navigate('/')} onContinue={() => navigate('/dashboard')} /></PageTransition>} />
          
          <Route element={<AppLayout user={currentUser} onLogout={onLogout} />}>
            <Route path="/dashboard" element={<PageTransition><BentoDashboard decks={decks} cards={cards} onCreateDeck={createDeck} onSelectDeck={(id)=>navigate(`/deck/${id}`)} onDeleteDeck={deleteDeck} onGenerateDeck={createGeneratedDeck} onNavigate={(v)=>navigate(v === 'AURA_CHAT' ? '/chat' : '/generate')} user={currentUser} /></PageTransition>} />
            <Route path="/dashboard/insights" element={<PageTransition><DashboardInsightsPage decks={decks} cards={cards} /></PageTransition>} />
            <Route path="/dashboard/planner" element={<PageTransition><DashboardPlannerPage decks={decks} cards={cards} navigate={navigate} /></PageTransition>} />
            <Route path="/deck/:id" element={<PageTransition><DeckDetailRoute decks={decks} cards={cards} navigate={navigate} deleteCard={deleteCard} setActiveDeckId={setActiveDeckId} /></PageTransition>} />
            <Route path="/generate" element={<PageTransition><GenerateCardsRoute activeDeckId={activeDeckId} navigate={navigate} user={currentUser} saveGeneratedCards={saveGeneratedCards} /></PageTransition>} />
            <Route path="/chat" element={<PageTransition><ChatRoute navigate={navigate} createGeneratedDeck={createGeneratedDeck} createDeckFromCards={createDeckFromCards} user={currentUser} /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage user={currentUser} onUpdateUser={updateUserProfile} /></PageTransition>} />
            <Route path="/admin/vault" element={<PageTransition><AdminConsolePage decks={decks} cards={cards} user={currentUser} /></PageTransition>} />
            <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          </Route>

          <Route path="/study/:deckId" element={<PageTransition><StudyModeRoute decks={decks} cards={cards} navigate={navigate} setActiveDeckId={setActiveDeckId} rateCard={rateCard} /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPasswordPage navigate={navigate} /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFoundPage navigate={navigate} /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <AmbientPlayer />
      <ScrollTopButton />
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
