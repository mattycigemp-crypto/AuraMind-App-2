import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TrophyIcon as Trophy, MedalIcon as Medal, CrownIcon as Crown, ChevronUpIcon as ChevronUp, ChevronDownIcon as ChevronDown, MinusIcon as Minus, UsersIcon as Users, CalendarIcon as Calendar } from '../icons/CustomIcons';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
  previousRank: number;
}

interface LeaderboardProps {
  currentUserId?: string;
  timeFilter?: 'daily' | 'weekly' | 'allTime';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId, timeFilter = 'weekly' }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'daily' | 'weekly' | 'allTime'>(timeFilter);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedFilter]);

  const loadLeaderboard = () => {
    setLoading(true);

    // Generate mock leaderboard data
    const mockUsers: LeaderboardUser[] = [
      { id: '1', name: 'Alex Chen', xp: 15420, streak: 45, level: 12, rank: 1, previousRank: 2 },
      { id: '2', name: 'Sarah Kim', xp: 14850, streak: 32, level: 11, rank: 2, previousRank: 1 },
      { id: '3', name: 'Mike Johnson', xp: 12300, streak: 28, level: 10, rank: 3, previousRank: 4 },
      { id: '4', name: 'Emma Davis', xp: 11200, streak: 21, level: 9, rank: 4, previousRank: 3 },
      { id: '5', name: 'James Wilson', xp: 10800, streak: 15, level: 9, rank: 5, previousRank: 6 },
      { id: '6', name: 'Lisa Brown', xp: 9500, streak: 18, level: 8, rank: 6, previousRank: 5 },
      { id: '7', name: 'David Lee', xp: 8900, streak: 12, level: 8, rank: 7, previousRank: 8 },
      { id: '8', name: 'Anna Taylor', xp: 8200, streak: 9, level: 7, rank: 8, previousRank: 7 },
      { id: '9', name: 'Chris Martin', xp: 7500, streak: 7, level: 7, rank: 9, previousRank: 10 },
      { id: '10', name: 'You', xp: 6800, streak: 5, level: 6, rank: 10, previousRank: 9 },
    ];

    // Simulate fetching different data based on filter
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 500);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted">{rank}</span>;
    }
  };

  const getRankChange = (previousRank: number, currentRank: number) => {
    const change = previousRank - currentRank;
    if (change > 0) {
      return <ChevronUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <ChevronDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-muted" />;
  };

  const getLevelTitle = (level: number) => {
    if (level >= 15) return 'Transcendent Sage';
    if (level >= 12) return 'Supreme Scholar';
    if (level >= 10) return 'Legendary Learner';
    if (level >= 7) return 'Expert Scholar';
    if (level >= 5) return 'Focused Studier';
    return 'Novice Learner';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-lg">Leaderboard</h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedFilter === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('daily')}
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-1" />
          Today
        </Button>
        <Button
          variant={selectedFilter === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('weekly')}
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-1" />
          Week
        </Button>
        <Button
          variant={selectedFilter === 'allTime' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('allTime')}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-1" />
          All Time
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted text-sm">Loading leaderboard...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Top 3 Podium */}
          {selectedFilter !== 'daily' && users.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                user.id === currentUserId ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(user.rank)}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted">Level {user.level} • {getLevelTitle(user.level)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{user.xp.toLocaleString()} XP</p>
                <p className="text-xs text-muted">🔥 {user.streak} days</p>
              </div>
            </div>
          ))}

          {/* Rest of the list */}
          {users.slice(selectedFilter !== 'daily' ? 3 : 0).map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                user.id === currentUserId ? 'bg-primary/10 border border-primary/30' : ''
              }`}
            >
              <div className="w-6 flex justify-center">
                <span className="text-sm text-muted font-medium">{user.rank}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm">{user.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.xp.toLocaleString()} XP</p>
              </div>
              <div className="w-4">
                {getRankChange(user.previousRank, user.rank)}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUserId && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted text-center">
            Your rank: <span className="font-bold text-primary">#{users.find(u => u.id === currentUserId)?.rank || '-'}</span>
          </p>
        </div>
      )}
    </Card>
  );
};

export default Leaderboard;


