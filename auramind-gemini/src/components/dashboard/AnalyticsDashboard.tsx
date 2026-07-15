import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Clock, Target, AlertTriangle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { analyticsService } from '../../services/analytics/analyticsService';
import type { FSRSAnalytics } from '../../services/study/fsrs';
import { RetentionConicChart } from '../../components/visualizations/RetentionConicChart';
import { StreakCalendarHeatmap } from '../../components/visualizations/StreakCalendarHeatmap';
import { MasteryRadarChart } from '../../components/visualizations/MasteryRadarChart';
import { AnimatedCounter } from './AnimatedCounter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import PageShell from './PageShell';

export interface AnalyticsDashboardProps {
  timeframe?: 'week' | 'month' | 'all';
}

interface LearningInsights {
  retentionRate: number;
  weeklyProgress: number;
  weakSpots: Array<{ id: string; question: string; weakness: string; severity: 'high' | 'medium' | 'low' }>;
  studyConsistency: number;
  predictedMasteryDate: string | null;
  fsrsAnalytics: FSRSAnalytics | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ timeframe = 'month' }) => {
  const { user } = useDashboardWorkspace();
  const [insights, setInsights] = useState<LearningInsights>({
    retentionRate: 0,
    weeklyProgress: 0,
    weakSpots: [],
    studyConsistency: 0,
    predictedMasteryDate: null,
    fsrsAnalytics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await analyticsService.getLearningInsights(user.id);
        setInsights(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Unable to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [user.id, timeframe]);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#8B5CF6]" />
              </div>
              <p className="mt-4 text-[#5A5A72] text-xs">Loading your learning insights...</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-12">
            <div className="flex flex-col items-center justify-center py-6">
              <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
              <p className="text-red-400 text-xs text-center">{error}</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const { retentionRate, weeklyProgress, weakSpots, studyConsistency, predictedMasteryDate } = insights;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[#F0EFFE] text-xl font-light tracking-tight flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-[#8B5CF6]" />
            Progress
          </h1>
          <p className="text-[#5A5A72] text-xs mt-0.5">
            Your learning analytics for this {timeframe}
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Retention Rate */}
          <AnimatedChartWrapper delay={0.1} animationType="fade-up">
            <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 hover:border-[#3A3A4F] transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                    <Activity className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">Retention Rate</h3>
                    <p className="text-[10px] text-[#5A5A72]">Based on ease factor progression</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-2xl font-semibold text-[#F0EFFE] tabular-nums">
                    <AnimatedCounter value={retentionRate} suffix="%" />
                  </p>
                  <p className="text-[10px] text-[#5A5A72]">
                    {retentionRate >= 80 ? 'Excellent' : retentionRate >= 60 ? 'Good' : retentionRate >= 40 ? 'Fair' : 'Needs improvement'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <RetentionConicChart progress={retentionRate} size={120} label="Retention" />
              </div>
            </div>
          </AnimatedChartWrapper>

          {/* Weekly Progress */}
          <AnimatedChartWrapper delay={0.2} animationType="fade-up">
            <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 hover:border-[#3A3A4F] transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                    <TrendingUp className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">Weekly Progress</h3>
                    <p className="text-[10px] text-[#5A5A72]">Cards studied this week</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-2xl font-semibold text-[#F0EFFE] tabular-nums">
                    <AnimatedCounter value={weeklyProgress} />
                  </p>
                  <p className="text-[10px] text-[#5A5A72]">
                    {weeklyProgress >= 50 ? 'Strong' : weeklyProgress >= 20 ? 'Moderate' : 'Light'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center overflow-hidden">
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
            </div>
          </AnimatedChartWrapper>

          {/* Study Consistency */}
          <AnimatedChartWrapper delay={0.3} animationType="fade-up">
            <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 hover:border-[#3A3A4F] transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                    <Clock className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">Study Consistency</h3>
                    <p className="text-[10px] text-[#5A5A72]">Days studied in last 30 days</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-2xl font-semibold text-[#F0EFFE] tabular-nums">
                    <AnimatedCounter value={studyConsistency} suffix="%" />
                  </p>
                  <p className="text-[10px] text-[#5A5A72]">
                    {studyConsistency >= 80 ? 'Excellent' : studyConsistency >= 60 ? 'Good' : studyConsistency >= 40 ? 'Fair' : 'Inconsistent'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <MasteryRadarChart
                  data={[
                    { subject: 'Mathematics', score: 85 },
                    { subject: 'Science', score: 72 },
                    { subject: 'History', score: 91 },
                    { subject: 'Literature', score: 68 },
                    { subject: 'Programming', score: 79 },
                    { subject: 'Languages', score: 63 },
                  ]}
                />
              </div>
            </div>
          </AnimatedChartWrapper>
        </div>

        {/* Mastery Prediction */}
        <AnimatedChartWrapper delay={0.4} animationType="fade-up">
          <div className={`rounded-xl border bg-[#111118] p-6 transition-all ${
            predictedMasteryDate ? 'border-[#8B5CF6]/40' : 'border-[#2A2A3A]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  predictedMasteryDate ? 'bg-[#8B5CF6]/10' : 'bg-[#2A2A3A]'
                }`}>
                  {predictedMasteryDate ? (
                    <Target className="h-5 w-5 text-[#8B5CF6]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#5A5A72]" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">Mastery Prediction</h3>
                  <p className="text-[10px] text-[#5A5A72]">Estimated date to mastery</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-center">
                {predictedMasteryDate ? (
                  <>
                    <p className="text-lg font-semibold text-[#F0EFFE] tabular-nums">
                      {new Date(predictedMasteryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-[#5A5A72]">
                      {Math.ceil((new Date(predictedMasteryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-[#5A5A72] tabular-nums">--</p>
                    <p className="text-[10px] text-[#5A5A72]">Keep studying!</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </AnimatedChartWrapper>

        {/* Weak Spots Analysis */}
        <AnimatedChartWrapper delay={0.5} animationType="fade-up">
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">Weak Spots</h3>
                  <p className="text-[10px] text-[#5A5A72]">
                    {weakSpots.length} area{weakSpots.length === 1 ? '' : 's'} needing attention
                  </p>
                </div>
              </div>
            </div>

            {weakSpots.length > 0 ? (
              <div className="space-y-2">
                {weakSpots.map((spot, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-[#1A1A24] rounded-lg">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg">
                      {spot.severity === 'high' ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-[#F0EFFE] line-clamp-1">
                        {spot.question.length > 50 ? spot.question.substring(0, 50) + '...' : spot.question}
                      </p>
                      <p className="text-[11px] text-[#5A5A72]">
                        {spot.weakness} &middot; Severity: {spot.severity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-[#5A5A72] text-xs">No weak spots detected! Your retention is strong across all topics.</p>
              </div>
            )}
          </div>
        </AnimatedChartWrapper>
      </div>
    </PageShell>
  );
};

export default AnalyticsDashboard;
