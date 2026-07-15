import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Flame, Clock, ChevronRight } from 'lucide-react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import PageShell from './PageShell';

export function StudyOverview() {
  const navigate = useNavigate();
  const { user, decks, cards, startQuickStudy } = useDashboardWorkspace();

  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { overdue, dueToday, reviewed, noDue } = useMemo(() => {
    const o: typeof decks = [];
    const d: typeof decks = [];
    const n: typeof decks = [];
    for (const deck of decks) {
      const deckCards = cards.filter((c) => c.deckId === deck.id);
      const hasOverdue = deckCards.some((c) => c.nextReview > 0 && c.nextReview < now);
      const hasDueToday = deckCards.some(
        (c) => c.nextReview >= now && c.nextReview <= todayEnd.getTime()
      );
      const hasReviewed = deckCards.some((c) => c.lastReviewed > 0);
      if (hasOverdue) o.push(deck);
      else if (hasDueToday) d.push(deck);
      else if (hasReviewed) n.push(deck);
    }
    return { overdue: o, dueToday: d, reviewed: o.length === 0 && d.length === 0 ? decks : n, noDue: n };
  }, [decks, cards, now, todayEnd]);

  const totalDue = cards.filter((c) => c.nextReview > 0 && c.nextReview <= todayEnd.getTime()).length;
  const studiedToday = cards.filter((c) => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return c.lastReviewed >= d.getTime();
  }).length;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#F0EFFE] text-xl font-light tracking-tight">Study</h1>
            <p className="text-[#5A5A72] text-xs mt-0.5">
              {totalDue > 0
                ? `${totalDue} cards to review`
                : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] text-xs">
              <Flame size={14} className="text-orange-400" />
              <span>{user.streak} day streak</span>
            </div>
            <button
              onClick={startQuickStudy}
              disabled={decks.length === 0 || totalDue === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap size={14} />
              Quick study
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Due today', value: totalDue, accent: 'text-[#8B5CF6]' },
            { label: 'Studied today', value: studiedToday, accent: 'text-emerald-400' },
            { label: 'Total decks', value: decks.length, accent: 'text-[#F0EFFE]' },
            { label: 'Total cards', value: cards.length, accent: 'text-sky-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-5">
              <div className="text-[#5A5A72] text-[11px] font-medium mb-1">{s.label}</div>
              <div className={`text-2xl font-semibold ${s.accent} tabular-nums`}>{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <Section title="Overdue" icon={Clock} accent="text-red-400" className="mb-6">
            {overdue.map((deck) => {
              const due = cards.filter((c) => c.deckId === deck.id && c.nextReview > 0 && c.nextReview < now).length;
              return <DeckRow key={deck.id} deck={deck} due={due} navigate={navigate} />;
            })}
          </Section>
        )}

        {/* Due today */}
        {dueToday.length > 0 && (
          <Section title="Due today" icon={Zap} accent="text-[#8B5CF6]" className="mb-6">
            {dueToday.map((deck) => {
              const due = cards.filter(
                (c) => c.deckId === deck.id && c.nextReview >= now && c.nextReview <= todayEnd.getTime()
              ).length;
              return <DeckRow key={deck.id} deck={deck} due={due} navigate={navigate} />;
            })}
          </Section>
        )}

        {/* Reviewed decks */}
        {noDue.length > 0 && overdue.length === 0 && dueToday.length === 0 && (
          <Section title="All reviewed" icon={Flame} accent="text-emerald-400" className="mb-6">
            {noDue.map((deck) => {
              const total = cards.filter((c) => c.deckId === deck.id).length;
              return (
                <div
                  key={deck.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#111118] border border-[#2A2A3A] hover:border-[#3A3A4F] transition-all"
                >
                  <div>
                    <span className="text-[#F0EFFE] text-sm font-medium">{deck.title}</span>
                    <p className="text-[#5A5A72] text-xs mt-0.5">{total} cards</p>
                  </div>
                  <button
                    onClick={() => navigate(`/study/${deck.id}`)}
                    className="text-[#8B5CF6] text-xs font-medium hover:text-[#7C3AED] transition-colors"
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </Section>
        )}

        {decks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-[#5A5A72] text-sm mb-2">No decks yet</div>
            <p className="text-[#3A3A4F] text-xs mb-4">Create a deck to start studying</p>
            <button
              onClick={() => navigate('/dashboard/decks')}
              className="px-4 py-2 bg-[#7C3AED]/10 text-[#8B5CF6] text-xs font-medium rounded-lg hover:bg-[#7C3AED]/20 transition-all"
            >
              Go to Library
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Section({
  title,
  icon: Icon,
  accent,
  children,
  className = '',
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={accent} />
        <h2 className="text-[#F0EFFE] text-sm font-medium">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DeckRow({
  deck,
  due,
  navigate,
}: {
  deck: { id: string; title: string };
  due: number;
  navigate: (path: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#111118] border border-[#2A2A3A] hover:border-[#3A3A4F] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
          <ChevronRight size={14} className="text-[#8B5CF6]" />
        </div>
        <div>
          <span className="text-[#F0EFFE] text-sm font-medium">{deck.title}</span>
          <p className="text-[#8B5CF6] text-xs mt-0.5">{due} cards due</p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/study/${deck.id}`)}
        className="px-3 py-1.5 bg-[#7C3AED] text-white text-[11px] font-medium rounded-lg hover:bg-[#6D28D9] transition-all"
      >
        Study
      </button>
    </motion.div>
  );
}
