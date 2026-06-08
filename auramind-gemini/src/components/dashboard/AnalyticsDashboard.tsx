import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { analyticsService } from '../../services/analytics/analyticsService';
import type { FSRSAnalytics } from '../../services/study/fsrs';
import {
  TrendingUpIcon as TrendingUp,
  ActivityIcon as Activity,
  ZapIcon as Zap,
  TargetIcon as Target,
  ClockIcon as Clock,
  AlertTriangleIcon as AlertTriangle,
  CheckCircle2Icon as CheckCircle2,
  AlertCircleIcon as AlertCircle
} from '../icons/CustomIcons';
import { RetentionConicChart } from '../../components/visualizations/RetentionConicChart';
import { StreakCalendarHeatmap } from '../../components/visualizations/StreakCalendarHeatmap';
import { MasteryRadarChart } from '../../components/visualizations/MasteryRadarChart';
import { AnimatedCounter } from './AnimatedCounter';
import { DashboardCard } from './DashboardCard';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { DashboardGlowBackground } from './DashboardGlowBackground';

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
      <GlassCard className="col-span-2">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 text-zinc-400">Loading your learning insights...</p>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="col-span-2 border-red-500/20 bg-red-500/[0.02]">
        <div className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </GlassCard>
    );
  }

  const { retentionRate, weeklyProgress, weakSpots, studyConsistency, predictedMasteryDate } = insights;

return (
     <div className="grid gap-6 relative">
       <DashboardGlowBackground />
       
       {/* Retention Rate - Enhanced with Conic Chart */}
       <AnimatedChartWrapper delay={0.1} animationType="fade-up">
         <DashboardCard enableTilt glowOnHover>
           <GlassCard className="border-primary/40 ring-1 ring-primary/20">
             <div className="space-y-4">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                     <TrendingUp className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Retention Rate</h3>
                     <p className="text-xs text-zinc-400">Based on ease factor progression</p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                     <AnimatedCounter value={retentionRate} suffix="%" />
                   </p>
                   <p className="text-xs text-zinc-500">
                     {retentionRate >= 80 ? 'Excellent' : retentionRate >= 60 ? 'Good' : retentionRate >= 40 ? 'Fair' : 'Needs Improvement'}
                   </p>
                 </div>
               </div>
               <div className="space-x-4">
                 <RetentionConicChart progress={retentionRate} size={120} label="Retention" />
               </div>
             </div>
           </GlassCard>
         </DashboardCard>
</AnimatedChartWrapper>

        {/* Weekly Progress - Enhanced with Streak Calendar */}
        <AnimatedChartWrapper delay={0.2} animationType="fade-up">
          <DashboardCard enableTilt glowOnHover>
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Weekly Progress</h3>
                      <p className="text-xs text-zinc-400">Cards studied this week</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                      <AnimatedCounter value={weeklyProgress} />
                    </p>
                    <p className="text-xs text-zinc-500">
                      {weeklyProgress >= 50 ? 'Strong' : weeklyProgress >= 20 ? 'Moderate' : 'Light'}
                    </p>
                  </div>
                </div>
                <div className="space-x-4">
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
            </GlassCard>
          </DashboardCard>
        </AnimatedChartWrapper>

        {/* Study Consistency - Enhanced with Mastery Radar */}
        <AnimatedChartWrapper delay={0.3} animationType="fade-up">
          <DashboardCard enableTilt glowOnHover>
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Study Consistency</h3>
                      <p className="text-xs text-zinc-400">Days studied in last 30 days</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                      <AnimatedCounter value={studyConsistency} suffix="%" />
                    </p>
                    <p className="text-xs text-zinc-500">
                      {studyConsistency >= 80 ? 'Excellent' : studyConsistency >= 60 ? 'Good' : studyConsistency >= 40 ? 'Fair' : 'Inconsistent'}
                    </p>
                  </div>
                </div>
                <div className="space-x-4">
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
            </GlassCard>
          </DashboardCard>
</AnimatedChartWrapper>

        {/* Mastery Prediction */}
        <AnimatedChartWrapper delay={0.4} animationType="fade-up">
          <DashboardCard enableTilt glowOnHover>
            <GlassCard className={predictedMasteryDate ? 'border-primary/40 ring-1 ring-primary/20' : 'border-zinc-700/30'}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    {predictedMasteryDate ? (
                      <Target className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-primary/50" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Mastery Prediction</h3>
                    <p className="text-xs text-zinc-400">Estimated date to mastery</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-center">
                  {predictedMasteryDate ? (
                    <>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {new Date(predictedMasteryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {Math.ceil((new Date(predictedMasteryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">--</p>
                      <p className="text-xs text-zinc-500">Keep studying!</p>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          </DashboardCard>
        </AnimatedChartWrapper>

        {/* Weak Spots Analysis */}
        <AnimatedChartWrapper delay={0.5} animationType="fade-up">
          <DashboardCard enableTilt glowOnHover>
            <GlassCard className="border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary">Weak Spots Analysis</h3>
                  <p className="text-xs text-primary/50">
                    {weakSpots.length} areas needing attention
                  </p>
                </div>
                
                {weakSpots.length > 0 ? (
                  <div className="space-y-3">
                    {weakSpots.map((spot, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 bg-zinc-800/20 rounded-lg">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg">
                          {spot.severity === 'high' ? (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-zinc-100 line-clamp-1">
                            {spot.question.length > 50 ? spot.question.substring(0, 50) + '...' : spot.question}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {spot.weakness} • Severity: {spot.severity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mb-3" />
                    <p className="text-zinc-400">No weak spots detected! Your retention is strong across all topics.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </DashboardCard>
        </AnimatedChartWrapper>
      </div>
    );
};

export default AnalyticsDashboard;


