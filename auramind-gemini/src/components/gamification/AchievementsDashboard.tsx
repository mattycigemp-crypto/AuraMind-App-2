import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { getUserStats, calculateLevel, getLevelProgress, getXPToNextLevel, ACHIEVEMENTS, getNextAchievements, UserStats, trackStudySession, STREAK_BONUSES } from '../../services/gamification/gamificationService';
import {
  Confetti,
  AnimeCelebration,
  StaggerList,
  useScrollReveal,
  type ConfettiHandle,
  type AnimeCelebrationHandle,
} from '../../lib/effects';

// Streak milestones are derived from STREAK_BONUSES keys (single source
// of truth — gamificationService is canonical). Any future milestone added
// to STREAK_BONUSES will automatically gate confetti here too.
const STREAK_MILESTONES = new Set<number>(
  Object.keys(STREAK_BONUSES).map(Number),
);

// Confetti intensity — milestone crossings are quieter than fresh
// achievement unlocks because the user has just seen a streak-week number
// on their dashboard; achievement-unlock is a more dramatic moment.
const CONFETTI_PARTICLES = {
  milestone: 80,
  achievement: 120,
} as const;
import { challengesService, Challenge } from '../../services/api/challengesService';

const AchievementsDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const workspace = useDashboardWorkspace();
  const [_earnedAchievements, setEarnedAchievements] = useState(ACHIEVEMENTS.filter(() => false));
  const [_availableAchievements, setAvailableAchievements] = useState(ACHIEVEMENTS);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const stats = getUserStats();
      setUserStats(stats);

      const { earned, available } = getNextAchievements();
      setEarnedAchievements(earned);
      setAvailableAchievements(available);

      // Load real challenges from API using actual user ID
      if (workspace?.user?.id) {
        try {
          const realChallenges = await challengesService.generateChallenges(workspace?.user.id);
          setChallenges(realChallenges || []);
        } catch {
          setChallenges([]);
        }
      } else {
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [workspace?.user?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const confettiRef = useRef<ConfettiHandle>(null);
  const animeRef = useRef<AnimeCelebrationHandle>(null);
  const statsReveal = useScrollReveal<HTMLDivElement>({
    enter: { duration: 500, opacity: [0, 1], translateY: [16, 0] },
  });

  const handleStudySession = () => {
    // Capture streak BEFORE the session so we can detect cross-milestone
    // (e.g. today = 2, after = 3 → fire confetti for hitting the 3-day
    // milestone). Achievements are returned by trackStudySession —
    // `newAchievements.length > 0` is the other trigger condition.
    const before = getUserStats().streakDays;
    const result = trackStudySession(900, 85);
    const after = getUserStats().streakDays;
    const crossedMilestone =
      after !== before && (STREAK_MILESTONES.has(after) || STREAK_MILESTONES.has(before));
    const unlocked = result.newAchievements.length > 0;
    if (unlocked || crossedMilestone) {
      confettiRef.current?.fire({
        particleCount: unlocked
          ? CONFETTI_PARTICLES.achievement
          : CONFETTI_PARTICLES.milestone,
      });
      // Anime.js v4 halo + label animation alongside the Confetti burst.
      // Particles + halo read as one celebration unit; either alone is
      // thinner. Label text is whichever earned-event is loudest at this
      // moment so the user sees WHAT they earned, not just THAT they did.
      const celebrateLabel = unlocked
        ? result.newAchievements.length === 1
          // Optional-chain `:0]?.title` keeps this safe under tsconfigs
          // that enable `noUncheckedIndexedAccess` (default-off but some
          // strict-TS configs flip it). The `?? 'Achievement unlocked'`
          // keeps a sensible fallback when `newAchievements[0]` is undefined.
          ? result.newAchievements[0]?.title ?? 'Achievement unlocked'
          : `${result.newAchievements.length} achievements!`
        : crossedMilestone
          ? `${after}-day streak`
          : `${result.xpAdded} XP`;
      const intensity: 'subtle' | 'normal' | 'epic' = unlocked
        ? 'epic'
        : crossedMilestone
          ? 'normal'
          : 'subtle';
      animeRef.current?.celebrate({ label: celebrateLabel, intensity });
    }
    const labels: string[] = [];
    if (result.xpAdded) labels.push(`${result.xpAdded} XP`);
    if (unlocked) labels.push(`${result.newAchievements.length} new achievement${result.newAchievements.length === 1 ? '' : 's'}`);
    if (crossedMilestone) labels.push(`${after}-day streak milestone`);
    if (labels.length > 0) alert(`Nice work! ${labels.join(', ')}.`);
    loadUserData();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">Loading your progress...</p>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">No user data available</p>
      </div>
    );
  }

  const levelInfo = calculateLevel(userStats.xp);
  const levelProgress = getLevelProgress(userStats.xp);
  const xpToNextLevel = getXPToNextLevel(userStats.xp);

  return (
    <div className="space-y-6">
      {/* Full-window canvas confetti burst — fires imperatively via confettiRef when
          an achievement unlocks or a streak milestone (3/7/30/100/365) is crossed. */}
      <Confetti ref={confettiRef} />
      {/* Anime.js v4 halo + label — fires alongside the confetti burst for the
          same trigger condition. Together: halo + particles + label = a single
          celebration unit. Either effect on its own reads as half-finished. */}
      <AnimeCelebration ref={animeRef} />
      {/* User Profile and Level */}
      <Card className="flex flex-col items-center text-center py-6">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-2xl">{levelInfo.level}</span>
          </div>
          <h3 className="font-bold text-xl">{userStats.xp} XP</h3>
          <p className="text-muted">Level {levelInfo.level} - {levelInfo.title}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/20 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 transition-all duration-500"
              style={{ width: `${levelProgress * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted mt-1">
            {Math.floor(levelProgress * 100)}% to Level {levelInfo.level + 1}
          </p>
          <p className="text-xs text-muted">
            {xpToNextLevel} XP needed for next level
          </p>
        </div>
      </Card>

      {/* Stats Overview
          Anime.js v4 composition:
            • useScrollReveal on the outer ScrollObserver → fades the whole
              strip in once when the section enters view.
            • StaggerList child of the same strip → each stat card slides up
              in sequence so the eye reads them in priority order:
              streak → accuracy → cards → time. */}
      <div
        ref={statsReveal.ref}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{ willChange: 'opacity, transform' }}
      >
        <StaggerList delayMs={70} durationMs={420} from="up" distance={16} className="contents">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase">Study Streak</p>
              <p className="font-bold text-xl">{userStats.streakDays || 0} days</p>
            </div>
            <div className="text-primary">
              <span className="material-symbols-outlined">fire</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase">Accuracy</p>
              <p className="font-bold text-xl">{Math.round(userStats.accuracy)}%</p>
            </div>
            <div className={userStats.accuracy >= 80 ? 'text-success' : 'text-warning'}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase">Cards Studied</p>
              <p className="font-bold text-xl">{userStats.cardsStudied || 0}</p>
            </div>
            <div className="text-primary">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase">Study Time</p>
              <p className="font-bold text-xl">
                {Math.floor((userStats.totalStudyTime || 0) / 3600)}h {Math.floor(((userStats.totalStudyTime || 0) % 3600) / 60)}m
              </p>
            </div>
            <div className="text-primary">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
        </Card>
        </StaggerList>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button 
          variant="default" 
          onClick={handleStudySession}
          className="px-8 py-3"
        >
          Start Study Session
          <span className="ml-2 material-symbols-outlined">psychology</span>
        </Button>
      </div>

      {/* Challenges */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">Active Challenges</h3>
            <Button variant="outline" size="sm" onClick={() => {/* Navigate to challenges page */}}>
              View All
            </Button>
          </div>
          
          {challenges.map((challenge) => (
            <div key={challenge.id} className="border rounded-lg p-4 hover:border-primary/20 transition-border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium">{challenge.title}</h4>
                  <p className="text-sm text-muted">{challenge.description}</p>
                </div>
                <div className="text-center space-x-2">
                  <Badge variant={challenge.reward.type === 'xp' ? 'default' : challenge.reward.type === 'badge' ? 'default' : 'secondary'}>
                    {challenge.reward.amount} {challenge.reward.type.toUpperCase()}
                  </Badge>
                  {!challenge.isCompleted && (
                    <span className="text-xs text-muted">{challenge.progress}/{challenge.maxProgress}</span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {!challenge.isCompleted && (
                <div className="w-full bg-muted/20 rounded-full h-1.5 overflow-hidden mb-2">
                  <div 
                    className="bg-primary h-1.5 transition-all duration-500"
                    style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                  ></div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">{challenge.type} • {challenge.category}</span>
                {challenge.isCompleted ? (
                  <span className="text-success font-medium">Completed!</span>
                ) : (
                  <span className="text-muted">Expires soon</span>
                )}
              </div>
            </div>
          ))}
          
          {challenges.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted">No active challenges at the moment</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AchievementsDashboard;


