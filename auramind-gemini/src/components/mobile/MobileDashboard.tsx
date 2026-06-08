import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUserStats } from '../../services/gamification/gamificationService';
import { challengesService, Challenge } from '../../services/api/challengesService';
import MobileStudyButton from './MobileStudyButton';

const MobileDashboard: React.FC = () => {
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'study'>('overview');
  const { toast } = useToast();
  const userId = 'current_user'; // Would come from auth in real app

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get user stats
      const userStats = getUserStats();
      setStats(userStats);
      
      // Get challenges
      const userChallenges = await challengesService.generateChallenges(userId);
      setChallenges(userChallenges);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted">No data available</p>
        <Button variant="outline" onClick={loadDashboardData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Study Button (Always visible at bottom on mobile) */}
      <div className="fixed bottom-4 left-4 right-4">
        <MobileStudyButton />
      </div>
      
      {/* Main Content */}
      <div className="pb-16">{/* Space for fixed button */}</div>
      
      {/* Tabs */}
      <div className="flex border-b border-muted/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium 
          ${activeTab === 'overview' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted hover:text-primary'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-3 text-sm font-medium 
          ${activeTab === 'challenges' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted hover:text-primary'}`}
        >
          Challenges
        </button>
        <button
          onClick={() => setActiveTab('study')}
          className={`px-4 py-3 text-sm font-medium 
          ${activeTab === 'study' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted hover:text-primary'}`}
        >
          Study
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* User Level and XP */}
          <Card className="text-center py-6">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-xl">{Math.floor(stats.xp / 1000)}k</span>
              </div>
              <h3 className="font-bold text-lg">{stats.xp} XP</h3>
              <p className="text-muted">Level {Math.floor(stats.xp / 1000) + 1}</p>
              <div className="w-full bg-muted/20 rounded-full h-2 mt-3 overflow-hidden">
                <div 
                  className="bg-primary h-2 transition-all duration-500"
                  style={{ width: `${(stats.xp % 1000) / 1000 * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted mt-1">
                {stats.xp % 1000} XP to next level
              </p>
            </div>
          </Card>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <div className="space-y-3">
                <p className="text-xs text-muted uppercase">Study Streak</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl">{stats.streakDays}</span>
                  <span className="text-primary">days</span>
                </div>
                <p className="text-xs text-muted">
                  {stats.streakDays >= 7 ? '🔥 On fire!' : 'Keep going!'}
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="space-y-3">
                <p className="text-xs text-muted uppercase">Accuracy</p>
                <div className="flex items-center justify-between">
                  <span className={stats.accuracy >= 80 ? 'font-bold text-success' : 'font-bold text-warning'}>
                    {stats.accuracy}%
                  </span>
                  <span className="text-muted">accuracy</span>
                </div>
                <p className="text-xs text-muted">
                  {stats.accuracy >= 90 ? 'Excellent!' : stats.accuracy >= 75 ? 'Good!' : 'Needs improvement'}
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="space-y-3">
                <p className="text-xs text-muted uppercase">Cards Studied</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl">{stats.cardsStudied}</span>
                  <span className="text-muted">cards</span>
                </div>
                <p className="text-xs text-muted">
                  {stats.cardsStudied >= 100 ? 'Impressive!' : 'Keep studying!'}
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="space-y-3">
                <p className="text-xs text-muted uppercase">Study Time</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl">
                    {Math.floor(stats.totalStudyTime / 3600)}h
                  </span>
                  <span className="text-muted">
                    {Math.floor((stats.totalStudyTime % 3600) / 60)}m
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {stats.totalStudyTime >= 3600 ? 'Great dedication!' : 'Keep learning!'}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Active Challenges</h3>
          
          {challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="p-4 hover:border-primary/20 transition-border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted">{challenge.description}</p>
                    </div>
                    <div className="text-center space-x-2">
                      <Badge 
                        variant={challenge.reward.type === 'xp' ? 'default' : 
                                challenge.reward.type === 'badge' ? 'default' : 
                                challenge.reward.type === 'coins' ? 'secondary' : 'outline'}
                      >
                        {challenge.reward.amount} {challenge.reward.type.toUpperCase()}
                      </Badge>
                      {!challenge.isCompleted && (
                        <span className="text-xs text-muted block">
                          {challenge.progress}/{challenge.maxProgress}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!challenge.isCompleted && (
                    <div className="w-full bg-muted/20 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 transition-all duration-500"
                        style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs mt-2">
                    <span className="text-muted">{challenge.type} • {challenge.category}</span>
                    {challenge.isCompleted ? (
                      <span className="text-success font-medium">Completed!</span>
                    ) : (
                      <span className="text-muted">Time remaining</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">No active challenges</p>
              <Button variant="outline" onClick={loadDashboardData} className="mt-4">
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'study' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Quick Study</h3>
          
          <div className="space-y-4">
            <Button 
              variant="default" 
              onClick={() => {
                toast({
                  title: "Flashcard Review Started",
                  description: "Let's review your cards!",
                  variant: "default",
                });
                // Navigate to study mode
              }}
              className="w-full py-3"
            >
              Flashcard Review
              <span className="ml-2 material-symbols-outlined">menu_book</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                toast({
                  title: "Quiz Mode Started",
                  description: "Test your knowledge!",
                  variant: "default",
                });
                // Navigate to quiz mode
              }}
              className="w-full py-3"
            >
              Quiz Mode
              <span className="ml-2 material-symbols-outiled">quiz</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                toast({
                  title: "AI Study Buddy Activated",
                  description: "Let's learn together!",
                  variant: "default",
                });
                // Navigate to AI chat
              }}
              className="w-full py-3"
            >
              AI Study Buddy
              <span className="ml-2 material-symbols-outlined">psychology</span>
            </Button>
          </div>
          
          <div className="border-t border-muted/50 pt-4">
            <h4 className="font-medium mb-2">Study Tips</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Study in 25-minute sessions for best retention</li>
              <li>• Review cards right before bed for better memory consolidation</li>
              <li>• Use voice input for hands-free studying</li>
              <li>• Take breaks every 90 minutes to maintain focus</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;


