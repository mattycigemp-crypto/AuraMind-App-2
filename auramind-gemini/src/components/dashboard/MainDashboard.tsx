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
import GlassCard from '../shared/GlassCard';
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
      <DashboardGlowBackground />
      
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-2"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-primary/70 font-mono-label">
          {greeting}, {user.name.split(/\s+/)[0]}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tight">
          Ship one learning win today
        </h1>
        <p className="text-zinc-400 max-w-2xl text-base md:text-lg">
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
                 data={[
                   { date: '2026-05-01', count: 5 },
                   { date: '2026-05-02', count: 3 },
                   { date: '2026-05-03', count: 0 },
                   { date: '2026-05-04', count: 8 },
                   { date: '2026-05-05', count: 2 },
                   { date: '2026-05-06', count: 0 },
                   { date: '2026-05-07', count: 1 },
                   { date: '2026-05-08', count: 4 },
                   { date: '2026-05-09', count: 6 },
                   { date: '2026-05-10', count: 0 },
                   { date: '2026-05-11', count: 3 },
                   { date: '2026-05-12', count: 7 },
                 ]}
               />
             </div>
             <div className="flex justify-center">
               <MasteryRadarChart 
                 data={[
                   { subject: 'Mathematics', score: 85 },
                   { subject: 'Science', score: 72 },
                   { subject: 'History', score: 91 },
                   { subject: 'Literature', score: 68 },
                   { subject: 'Programming', score: 79 },
                   { subject: 'Languages', score: 63 }
                 ]}
               />
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
            <button
              type="button"
              onClick={() => (decks.length ? startQuickStudy() : onNavigate('cards'))}
              className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {decks.length ? 'Start session' : 'Create a deck'}
            </button>
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
    </div>
  );
};

export default MainDashboard;
