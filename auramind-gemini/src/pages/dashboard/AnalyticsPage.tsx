import React, { useEffect, useState, useMemo } from 'react';
import { RetentionLineChart } from '../../components/charts/RetentionLineChart';
import { CalendarHeatmap } from '../../components/charts/CalendarHeatmap';
import { FutureDueChart } from '../../components/charts/FutureDueChart';
import { TimeOfDayChart } from '../../components/charts/TimeOfDayChart';
import { WeakestCardsTable, type WeakCard } from '../../components/charts/WeakestCardsTable';
import { CardMaturityArea } from '../../components/charts/CardMaturityArea';
import { ButtonDistribution } from '../../components/charts/ButtonDistribution';
import { PageHeader } from '../../components/dashboard/UnifiedDashboard';
import StatCard from '../../components/dashboard/StatCard';
import {
  TargetIcon as Target,
  ActivityIcon as Activity,
  LayersIcon as Layers,
  FolderOpenIcon as FolderOpen,
  BrainCircuitIcon as BrainCircuit,
  ClockIcon as Clock,
  BarChart3Icon as BarChart3,
} from '../../components/icons/CustomIcons';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { analyticsService } from '../../services/analytics/analyticsService';
import { getFSRSAnalytics, getFSRSState, calculateRetrievability } from '../../services/study/fsrs';
import type { Card } from '../../types';
import { cn } from '../../lib/utils';

interface AnalyticsPageProps {
  className?: string;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ className }) => {
  const { user, cards, decks } = useDashboardWorkspace();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsService.getLearningInsights(user.id);
        setInsights(data);
      } catch {
        setInsights(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  const fsrsAnalysis = useMemo(() => {
    if (cards.length === 0) return null;
    return getFSRSAnalytics(cards as Card[]);
  }, [cards]);

  const retentionRate = insights?.retentionRate ?? (fsrsAnalysis ? Math.round(fsrsAnalysis.predictedRetention * 100) : 0);
  const weeklyProgress = insights?.weeklyProgress ?? (fsrsAnalysis ? fsrsAnalysis.cardsDueThisWeek : 0);
  const studyConsistency = insights?.studyConsistency ?? 0;
  const totalCards = cards.length;
  const totalDecks = decks.length;

  const reviewedCards = useMemo(() => cards.filter((c) => c.lastReviewed), [cards]);

  const heatmapData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of reviewedCards) {
      const key = formatDate(c.lastReviewed!);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
  }, [reviewedCards]);

  const timeOfDayData = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    for (const c of reviewedCards) {
      const hour = new Date(c.lastReviewed!).getHours();
      hourCounts[hour]++;
    }
    const max = Math.max(...hourCounts, 1);
    return hourCounts.map((count, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      sessions: count,
    }));
  }, [reviewedCards]);

  const futureDueData = useMemo(() => {
    if (!fsrsAnalysis) return [];
    return [
      { period: 'Today', count: fsrsAnalysis.cardsDueToday, fill: '#8B5CF6' },
      { period: 'This Week', count: fsrsAnalysis.cardsDueThisWeek, fill: '#7C3AED' },
      { period: 'This Month', count: fsrsAnalysis.cardsDueThisMonth, fill: '#6D28D9' },
    ];
  }, [fsrsAnalysis]);

  const retentionTrendData = useMemo(() => {
    const dayBuckets = new Map<string, number[]>();
    for (const c of reviewedCards) {
      const key = formatDate(c.lastReviewed!);
      if (!dayBuckets.has(key)) dayBuckets.set(key, []);
      const state = getFSRSState(c as Card);
      dayBuckets.get(key)!.push(calculateRetrievability(state));
    }
    const sorted = Array.from(dayBuckets.entries()).sort(([a], [b]) => a.localeCompare(b));
    const last15 = sorted.slice(-15);
    return last15.map(([date, retrievabilities]) => {
      const avg = retrievabilities.reduce((s, r) => s + r, 0) / retrievabilities.length;
      return { date: formatShortDate(date), retention: Math.round(avg * 100) };
    });
  }, [reviewedCards]);

  const weakCards = useMemo((): WeakCard[] => {
    if (cards.length === 0) return [];
    return cards
      .filter((c) => {
        const state = getFSRSState(c as Card);
        return calculateRetrievability(state) < 0.7 && c.repetition !== undefined && c.repetition > 0;
      })
      .slice(0, 10)
      .map((c) => {
        const state = getFSRSState(c as Card);
        const deck = decks.find((d) => d.id === c.deckId);
        return {
          id: c.id,
          question: c.front,
          retrievability: calculateRetrievability(state),
          stability: state.stability,
          difficulty: state.difficulty,
          deckName: deck?.title,
        };
      });
  }, [cards, decks]);

  const maturityTimeline = useMemo(() => {
    if (cards.length === 0) return [];
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const weekStart = now - (11 - i) * 7 * DAY_MS;
      const weekEnd = weekStart + 7 * DAY_MS;
      const weekCards = cards.filter(c => {
        const lr = c.lastReviewed || 0;
        return lr >= weekStart && lr < weekEnd;
      });
      const mature = weekCards.filter(c => (c.interval || 0) >= 21).length;
      const young = weekCards.filter(c => (c.interval || 0) >= 7 && (c.interval || 0) < 21).length;
      const newC = weekCards.filter(c => (c.interval || 0) < 7).length;
      const d = new Date(weekStart);
      return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), new: newC, young, mature };
    });
  }, [cards]);

  const buttonDistData = useMemo(() => {
    const dist = [
      { name: 'Again', value: 0, color: '#ef4444' },
      { name: 'Hard', value: 0, color: '#f97316' },
      { name: 'Good', value: 0, color: '#22c55e' },
      { name: 'Easy', value: 0, color: '#3b82f6' },
    ];
    for (const c of cards) {
      if (!c.lastReviewed || !c.interval) continue;
      if (c.interval <= 1 && c.repetition === 0) dist[0].value++;
      else if (c.easeFactor && c.easeFactor < 2.0) dist[1].value++;
      else if (c.easeFactor && c.easeFactor < 2.5) dist[2].value++;
      else dist[3].value++;
    }
    return dist;
  }, [cards]);

  const hasActivity = reviewedCards.length > 0;
  const hasFutureDue = futureDueData.some((d) => d.count > 0);

  return (
    <div className={cn("space-y-12 pb-20", className)}>
      <PageHeader
        title="Neural Analytics"
        description="Quantifying cognitive progression and retention coherence"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Retention" value={`${retentionRate}%`} subtitle="Knowledge stability" icon={Target} variant="cosmic" />
        <StatCard title="Weekly Reviews" value={weeklyProgress} subtitle="Cards this week" icon={Activity} />
        <StatCard title="Total Cards" value={totalCards} subtitle="Concepts mapped" icon={Layers} />
        <StatCard title="Consistency" value={`${studyConsistency}%`} subtitle="Study regularity" icon={FolderOpen} trend={{ value: studyConsistency >= 60 ? 'Good' : 'Needs Work', type: studyConsistency >= 60 ? 'positive' : 'negative' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Retention Trend</h3>
            <span className="text-[10px] text-zinc-500 italic">Computed from review history</span>
          </div>
          {retentionTrendData.length > 0 ? (
            <RetentionLineChart data={retentionTrendData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-600 italic text-sm">
              No review data yet — start studying to see your retention trend
            </div>
          )}
        </div>
        <div className="lg:col-span-2 architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Study Activity</h3>
            <Clock size={14} className="text-primary/60" />
          </div>
          {hasActivity ? (
            <CalendarHeatmap data={heatmapData} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-zinc-600 italic text-sm">
              No study activity recorded yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Card Maturity</h3>
            <span className="text-[10px] text-zinc-500 italic">Current state</span>
          </div>
          {fsrsAnalysis && fsrsAnalysis.totalCards > 0 ? (
            <div className="space-y-6 pt-4">
              {[
                { label: 'Mature', count: fsrsAnalysis.matureCards, color: 'bg-green-500', pct: (fsrsAnalysis.matureCards / fsrsAnalysis.totalCards) * 100 },
                { label: 'Young', count: fsrsAnalysis.youngCards, color: 'bg-primary', pct: (fsrsAnalysis.youngCards / fsrsAnalysis.totalCards) * 100 },
                { label: 'New', count: fsrsAnalysis.newCards, color: 'bg-amber-500', pct: (fsrsAnalysis.newCards / fsrsAnalysis.totalCards) * 100 },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold">{item.count} ({Math.round(item.pct)}%)</span>
                  </div>
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-zinc-600 italic text-sm">
              No cards yet — create a deck to begin
            </div>
          )}
        </div>
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Future Due</h3>
            <span className="text-[10px] text-zinc-500 italic">Review forecast</span>
          </div>
          {hasFutureDue ? (
            <FutureDueChart data={futureDueData} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-zinc-600 italic text-sm">
              {totalCards > 0 ? 'All cards reviewed — nothing due' : 'No cards yet'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Peak Study Hours</h3>
            <span className="text-[10px] text-zinc-500 italic">From review timestamps</span>
          </div>
          {hasActivity ? (
            <TimeOfDayChart data={timeOfDayData} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-zinc-600 italic text-sm">
              No review history yet
            </div>
          )}
        </div>
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Deck Distribution</h3>
            <BarChart3 size={14} className="text-primary/60" />
          </div>
          {decks.length > 0 ? (
            <div className="space-y-4 pt-2">
              {decks.slice(0, 8).map((deck) => {
                const deckCards = cards.filter((c) => c.deckId === deck.id);
                const maxCount = Math.max(...decks.slice(0, 8).map((d) => cards.filter((c) => c.deckId === d.id).length), 1);
                const pct = (deckCards.length / maxCount) * 100;
                return (
                  <div key={deck.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate max-w-[200px]">{deck.title}</span>
                      <span className="text-[9px] text-zinc-500">{deckCards.length}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-zinc-600 italic text-sm">
              No decks yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Maturity Timeline</h3>
            <span className="text-[10px] text-zinc-500 italic">Weekly breakdown</span>
          </div>
          {maturityTimeline.length > 0 && maturityTimeline.some(d => d.mature + d.young + d.new > 0) ? (
            <CardMaturityArea data={maturityTimeline} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-600 italic text-sm">
              Study over time to see your card maturity progression
            </div>
          )}
        </div>
        <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Rating Distribution</h3>
            <span className="text-[10px] text-zinc-500 italic">Review pattern</span>
          </div>
          {buttonDistData.some(d => d.value > 0) ? (
            <ButtonDistribution data={buttonDistData} />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-zinc-600 italic text-sm">
              Start reviewing cards to see your rating pattern
            </div>
          )}
        </div>
      </div>

      <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BrainCircuit size={18} className="text-primary" />
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Weakest Cards</h3>
          </div>
          <span className="text-[10px] text-zinc-500 italic">Lowest retrievability</span>
        </div>
        {weakCards.length > 0 ? (
          <WeakestCardsTable data={weakCards} />
        ) : (
          <div className="flex items-center justify-center h-32 text-zinc-600 italic text-sm">
            {totalCards > 0 ? 'All pathways stable — no weak cards detected' : 'No cards yet'}
          </div>
        )}
      </div>
    </div>
  );
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default AnalyticsPage;



