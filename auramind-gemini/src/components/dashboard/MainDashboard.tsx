import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon as ArrowRight,
  BotIcon as Bot,
  CheckCircle2Icon as CheckCircle2,
  CircleIcon as Circle,
  FlameIcon as Flame,
  LayersIcon as Layers,
  SparklesIcon as Sparkles,
  TargetIcon as Target,
} from '../icons/CustomIcons';
import { MagneticButton } from '../ui/MagneticButton';
import GlassCard from '../shared/GlassCard';
import Confetti from '../shared/Confetti';
import OnboardingTutorial from '../shared/OnboardingTutorial';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { RetentionConicChart } from '../../components/visualizations/RetentionConicChart';
import { StreakCalendarHeatmap } from '../../components/visualizations/StreakCalendarHeatmap';
import { MasteryRadarChart } from '../../components/visualizations/MasteryRadarChart';
import { AnimatedCounter } from './AnimatedCounter';
import { DashboardCard } from './DashboardCard';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { DashboardGlowBackground } from './DashboardGlowBackground';

export interface MainDashboardProps {
  onNavigate: (section: string) => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate }) => {
  const { user, decks, cards, startQuickStudy, goToDeck } = useDashboardWorkspace();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ─── Confetti listener ───
  useEffect(() => {
    const handler = () => setShowConfetti(true);
    window.addEventListener('auramind:celebrate', handler);
    return () => window.removeEventListener('auramind:celebrate', handler);
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  useEffect(() => {
    const completed = localStorage.getItem('auramind:completedTutorials');
    if (completed) {
      try {
        const parsed = JSON.parse(completed);
        if (Array.isArray(parsed) && parsed.includes('onboarding')) return;
      } catch {}
    }
    const timer = setTimeout(() => setShowTutorial(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const dueCount = useMemo(
    () => cards.filter((c) => c.nextReview <= Date.now()).length,
    [cards]
  );
  const studiedCount = useMemo(
    () => cards.filter((c) => (c.repetition ?? 0) > 0 || (c.lastReviewed && c.lastReviewed > 0)).length,
    [cards]
  );
  const progressPct =
    cards.length === 0 ? 0 : Math.min(100, Math.round((studiedCount / cards.length) * 100));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const steps = [
    {
      key: 'deck',
      title: 'Create your first deck',
      description: 'Name a topic — you can add cards right after.',
      done: decks.length > 0,
      action: () => onNavigate('cards'),
      cta: 'Open decks',
    },
    {
      key: 'cards',
      title: 'Add or generate cards',
      description: 'Manual entry, import, or AI — get to ~10 cards for momentum.',
      done: cards.length >= 3,
      action: () => onNavigate('cards'),
      cta: 'Manage cards',
    },
    {
      key: 'study',
      title: 'Complete a study session',
      description: 'Spaced repetition works when you show up — even 3 minutes counts.',
      done: cards.some((c) => c.lastReviewed && c.lastReviewed > 0),
      action: startQuickStudy,
      cta: 'Study now',
      disabled: decks.length === 0,
    },
  ];

  const checklistComplete = steps.every((s) => s.done);
  const firstDeckId = decks[0]?.id;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Ambient texture */}
      <img
        src="/auramind/dashboard-ambient.png"
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.06 }}
      />
      <DashboardGlowBackground />
      
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-2 relative"
      >
        {/* Mesh gradient hero card layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite" }}
          />
          <div className="absolute -bottom-12 right-0 w-56 h-56 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite 6s" }}
          />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(80px)", animation: "aurora-drift 18s ease-in-out infinite 12s" }}
          />
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-primary/70 font-mono-label">
          {greeting}, {user.name.split(/\s+/)[0]}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tight relative z-10">
          Ship one learning win today
        </h1>
        <p className="text-zinc-400 max-w-2xl text-base md:text-lg relative z-10">
          Insights first, noise never — prioritized like Linear and Duolingo: due cards, streak, then everything else.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard delay={0.1} enableTilt glowOnHover>
          <GlassCard className={dueCount > 0 ? 'border-primary/40 ring-1 ring-primary/20' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Due now</h3>
              <Target className="w-4 h-4 text-primary/80" aria-hidden />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
              <AnimatedCounter value={dueCount} />
            </p>
            <p className="text-sm text-zinc-500 mt-1">Across all decks • spaced repetition queue</p>
          </GlassCard>
        </DashboardCard>

        <DashboardCard delay={0.15} enableTilt glowOnHover>
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Cards</h3>
              <Layers className="w-4 h-4 text-primary/80" aria-hidden />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
              <AnimatedCounter value={cards.length} />
            </p>
            <p className="text-sm text-zinc-500 mt-1">In your library</p>
          </GlassCard>
        </DashboardCard>

        <DashboardCard delay={0.2} enableTilt glowOnHover>
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Decks</h3>
              <Layers className="w-4 h-4 text-primary/80" aria-hidden />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
              <AnimatedCounter value={decks.length} />
            </p>
            <p className="text-sm text-zinc-500 mt-1">Study collections</p>
          </GlassCard>
        </DashboardCard>

        <DashboardCard delay={0.25} enableTilt glowOnHover>
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Streak</h3>
              <Flame className="w-4 h-4 text-orange-400" aria-hidden />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
              <AnimatedCounter value={user.streak ?? 0} />
            </p>
            <p className="text-sm text-zinc-500 mt-1">Days in a row</p>
          </GlassCard>
        </DashboardCard>
      </div>

      {/* Suggested for you */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Suggested for you</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-[10px] font-medium ring-1 ring-violet-500/30">
            <Sparkles className="w-3 h-3" />
            AI
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decks.length > 0 ? (
            decks.slice(0, 3).map((deck, i) => {
              const due = cards.filter(c => c.deckId === deck.id && c.nextReview <= Date.now()).length;
              const total = cards.filter(c => c.deckId === deck.id).length;
              const lastStudied = cards.filter(c => c.deckId === deck.id && c.lastReviewed).sort((a, b) => b.lastReviewed - a.lastReviewed)[0];
              return (
                <DashboardCard key={deck.id} delay={0.25 + i * 0.07} enableTilt glowOnHover>
                  <GlassCard className="border-primary/10 hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => goToDeck(deck.id)}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">📚</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">{due > 0 ? `${due} due` : 'All caught up'} · {total} cards</span>
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-primary transition-colors">{deck.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{deck.description || (lastStudied ? `Last studied ${Math.round((Date.now() - lastStudied.lastReviewed) / 3600000)}h ago` : 'Ready to start studying')}</p>
                    </div>
                  </GlassCard>
                </DashboardCard>
              );
            })
          ) : (
            <DashboardCard delay={0.25} enableTilt glowOnHover>
              <GlassCard className="border-primary/10">
                <div className="space-y-2 text-center py-4">
                  <span className="text-2xl">🚀</span>
                  <h3 className="text-sm font-semibold text-zinc-100">Create your first deck</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">AI will suggest topics once you start studying.</p>
                </div>
              </GlassCard>
            </DashboardCard>
          )}
        </div>
      </motion.section>

      <AnimatedChartWrapper delay={0.3} animationType="fade-up">
        <GlassCard variant="neural" className="border-primary/20">
         <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-5 h-5 text-primary" aria-hidden />
               <span className="text-xs font-mono-label uppercase tracking-widest text-primary/80">
                 Mastery pulse
               </span>
             </div>
             <h2 className="text-xl font-semibold text-zinc-50 mb-1">Retention coverage</h2>
           </div>
           <p className="text-zinc-400 text-sm max-w-xl">
             Share of cards you have practiced at least once. Aim for steady climbs — not perfection on day one.
           </p>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mt-8">
             <div className="flex justify-center">
               <RetentionConicChart progress={progressPct} size={200} label="Retention" />
             </div>
             <div className="flex justify-center w-full overflow-x-auto">
               <StreakCalendarHeatmap 
                 data={(() => {
                   // Build real heatmap from card study dates
                   const studyMap = new Map<string, number>();
                   cards.forEach(c => {
                     if (c.lastReviewed && c.lastReviewed > 0) {
                       const d = new Date(c.lastReviewed).toISOString().slice(0, 10);
                       studyMap.set(d, (studyMap.get(d) || 0) + 1);
                     }
                   });
                   return Array.from(studyMap.entries()).map(([date, count]) => ({ date, count }));
                 })()}
               />
             </div>
             <div className="flex justify-center">
               {decks.length > 0 ? (
                 <MasteryRadarChart 
                   data={decks.slice(0, 6).map(deck => {
                     const deckCards = cards.filter(c => c.deckId === deck.id);
                     const studied = deckCards.filter(c => (c.repetition ?? 0) > 0 || (c.lastReviewed && c.lastReviewed > 0)).length;
                     const score = deckCards.length > 0 ? Math.round((studied / deckCards.length) * 100) : 0;
                     return { subject: deck.title.slice(0, 14), score };
                   })}
                 />
               ) : (
                 <div className="text-center text-zinc-500 text-sm py-8">
                   <p>Mastery data appears after</p>
                   <p>you create and study decks</p>
                 </div>
               )}
             </div>
           </div>
         </div>
        </GlassCard>
      </AnimatedChartWrapper>

      {!checklistComplete && (
        <GlassCard className="border-emerald-500/20 bg-emerald-500/[0.03]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-emerald-200 mb-2">Getting started</h2>
              <p className="text-zinc-400 text-sm max-w-xl">
                Three bite-sized wins — patterned after onboarding that lifts activation in mature SaaS (short path to first success).
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-4">
            {steps.map((s) => (
              <li key={s.key} className="flex gap-4">
                <div className="pt-1">
                  {s.done ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden />
                  ) : (
                    <Circle className="w-6 h-6 text-zinc-600 shrink-0" aria-hidden />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-zinc-100">{s.title}</p>
                  <p className="text-sm text-zinc-500">{s.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!s.disabled) s.action();
                    }}
                    disabled={s.disabled}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:underline"
                  >
                    {s.cta}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <GlassCard variant="neural" className="md:col-span-2 border-primary/20">
          <h2 className="text-xl font-bold text-primary mb-2">Next best action</h2>
          <p className="text-zinc-400 mb-6">
            {dueCount > 0
              ? `${dueCount} card${dueCount === 1 ? '' : 's'} are due — knocking them down keeps your forgetting curve shallow.`
              : decks.length === 0
                ? 'Spin up your first deck. Empty libraries do not learn — yours should not stay empty.'
                : 'Nothing due right now. Add harder cards via AI Chat or sneak in early review.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <MagneticButton
              onClick={() => (decks.length ? startQuickStudy() : onNavigate('cards'))}
              className="shimmer-sweep px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {decks.length ? 'Start session' : 'Create a deck'}
            </MagneticButton>
            {firstDeckId && (
              <button
                type="button"
                onClick={() => goToDeck(firstDeckId)}
                className="px-5 py-2.5 rounded-xl border border-primary/40 text-primary font-semibold hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Open deck
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:border-primary/40 hover:text-primary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bot className="w-4 h-4" aria-hidden />
              AI Chat
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Keyboard of mind</h3>
          <ul className="space-y-3 text-sm text-zinc-500">
            <li>Study picks due cards first — like a prioritized inbox.</li>
            <li>Use search in the top bar to jump to any deck.</li>
            <li>Paths will bundle lessons; your decks stay the source of truth.</li>
          </ul>
        </GlassCard>
      </div>

      <OnboardingTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setShowTutorial(false)}
      />

      {/* Confetti celebration */}
      <Confetti isActive={showConfetti} particleCount={80} duration={3000} />
    </div>
  );
};

export default MainDashboard;
