import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { getUserStats, awardXP, XP_REWARDS, calculateLevel, getLevelProgress, getXPToNextLevel, ACHIEVEMENTS, checkAchievements, getEarnedAchievements, getNextAchievements, UserStats, trackStudySession } from '../../services/gamification/gamificationService';
import { challengesService, Challenge } from '../../services/api/challengesService';

const AchievementsDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('current_user');
  const [earnedAchievements, setEarnedAchievements] = useState(ACHIEVEMENTS.filter(() => false));
  const [availableAchievements, setAvailableAchievements] = useState(ACHIEVEMENTS);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    setLoading(true);
    try {
      const stats = getUserStats();
      setUserStats(stats);

      const { earned, available } = getNextAchievements();
      setEarnedAchievements(earned);
      setAvailableAchievements(available);

      // Generate mock challenges for now
      setChallenges([
        { id: '1', title: 'Daily Practice', description: 'Study for 15 minutes today', type: 'daily' as const, difficulty: 'easy' as const, category: 'Study', reward: { type: 'xp' as const, amount: 25, icon: 'star' }, progress: 10, maxProgress: 15, isCompleted: false, isLocked: false, deadline: '', createdAt: '', updatedAt: '' },
        { id: '2', title: 'Card Master', description: 'Review 20 flashcards', type: 'weekly' as const, difficulty: 'medium' as const, category: 'Review', reward: { type: 'xp' as const, amount: 50, icon: 'star' }, progress: 15, maxProgress: 20, isCompleted: false, isLocked: false, deadline: '', createdAt: '', updatedAt: '' },
        { id: '3', title: 'Streak Builder', description: 'Maintain a 3-day streak', type: 'weekly' as const, difficulty: 'medium' as const, category: 'Streak', reward: { type: 'badge' as const, amount: 1, icon: 'star' }, progress: 2, maxProgress: 3, isCompleted: false, isLocked: false, deadline: '', createdAt: '', updatedAt: '' },
      ]);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudySession = () => {
    const result = trackStudySession(900, 85);
    alert(`You earned ${result.xpAdded} XP!`);
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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


