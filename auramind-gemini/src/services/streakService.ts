import { STREAK_BONUSES } from './gamification/gamificationService';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyDays: number;
  streakHistory: StreakDay[];
}

export interface StreakDay {
  date: string;
  minutesStudied: number;
  cardsReviewed: number;
}

const STREAK_KEY = 'auramind_streak_data';
const REMINDER_TIME_KEY = 'auramind_reminder_time';

// Get current streak data
export const getStreakData = (): StreakData => {
  if (typeof window === 'undefined') {
    return getDefaultStreakData();
  }

  const saved = localStorage.getItem(STREAK_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  return getDefaultStreakData();
};

const getDefaultStreakData = (): StreakData => ({
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  totalStudyDays: 0,
  streakHistory: []
});

// Record study activity for today
export const recordStudyActivity = (minutesStudied: number, cardsReviewed: number): { streak: number; bonus: number; newStreak: boolean } => {
  if (typeof window === 'undefined') {
    return { streak: 0, bonus: 0, newStreak: false };
  }

  const today = new Date().toISOString().split('T')[0];
  let data = getStreakData();

  // Check if already studied today
  const alreadyStudiedToday = data.streakHistory.some(day => day.date === today);

  if (!alreadyStudiedToday) {
    // Check if streak continues (studied yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.lastStudyDate === yesterdayStr) {
      data.currentStreak += 1;
    } else if (data.lastStudyDate !== today) {
      // Streak broken, start new
      data.currentStreak = 1;
    }

    // Update longest streak if needed
    if (data.currentStreak > data.longestStreak) {
      data.longestStreak = data.currentStreak;
    }

    data.totalStudyDays += 1;
    data.lastStudyDate = today;
  }

  // Add or update today's entry
  const todayEntry = data.streakHistory.find(day => day.date === today);
  if (todayEntry) {
    todayEntry.minutesStudied += minutesStudied;
    todayEntry.cardsReviewed += cardsReviewed;
  } else {
    data.streakHistory.push({
      date: today,
      minutesStudied,
      cardsReviewed
    });
  }

  // Keep only last 365 days
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  data.streakHistory = data.streakHistory.filter(
    day => new Date(day.date) >= oneYearAgo
  );

  // Save
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));

  // Calculate streak bonus
  let bonus = 0;
  const streakBonus = STREAK_BONUSES[data.currentStreak as keyof typeof STREAK_BONUSES];
  if (streakBonus && !alreadyStudiedToday) {
    bonus = streakBonus;
  }

  return {
    streak: data.currentStreak,
    bonus,
    newStreak: !alreadyStudiedToday
  };
};

// Check if user studied today
export const hasStudiedToday = (): boolean => {
  const data = getStreakData();
  const today = new Date().toISOString().split('T')[0];
  return data.lastStudyDate === today;
};

// Get study streak status with motivational message
export const getStreakStatus = (): { status: 'active' | 'at_risk' | 'broken'; message: string; daysUntilBreak: number } => {
  const data = getStreakData();
  const today = new Date().toISOString().split('T')[0];

  if (data.lastStudyDate === today) {
    return {
      status: 'active',
      message: `🔥 ${data.currentStreak}-day streak! Keep it going!`,
      daysUntilBreak: 1
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.lastStudyDate === yesterdayStr) {
    return {
      status: 'at_risk',
      message: `⚠️ Study today to maintain your ${data.currentStreak}-day streak!`,
      daysUntilBreak: 0
    };
  }

  return {
    status: 'broken',
    message: `Start a new streak today! Your best was ${data.longestStreak} days.`,
    daysUntilBreak: 0
  };
};

// Get weekly summary
export const getWeeklySummary = (): { daysStudied: number; totalMinutes: number; totalCards: number } => {
  const data = getStreakData();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekData = data.streakHistory.filter(day => new Date(day.date) >= weekAgo);

  return {
    daysStudied: weekData.length,
    totalMinutes: weekData.reduce((sum, day) => sum + day.minutesStudied, 0),
    totalCards: weekData.reduce((sum, day) => sum + day.cardsReviewed, 0)
  };
};

// Get monthly summary
export const getMonthlySummary = (): { daysStudied: number; totalMinutes: number; totalCards: number; streakDays: number[] } => {
  const data = getStreakData();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const monthData = data.streakHistory.filter(day => new Date(day.date) >= monthAgo);

  return {
    daysStudied: monthData.length,
    totalMinutes: monthData.reduce((sum, day) => sum + day.minutesStudied, 0),
    totalCards: monthData.reduce((sum, day) => sum + day.cardsReviewed, 0),
    streakDays: monthData.map(day => new Date(day.date).getDate())
  };
};

// Set reminder time
export const setReminderTime = (time: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_TIME_KEY, time);
};

// Get reminder time
export const getReminderTime = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REMINDER_TIME_KEY);
};

// Check if it's time for a reminder
export const shouldShowReminder = (): boolean => {
  const reminderTime = getReminderTime();
  if (!reminderTime) return false;

  const now = new Date();
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  // Show reminder within 30 minutes of set time
  const diff = Math.abs(now.getTime() - reminderDate.getTime());
  return diff <= 30 * 60 * 1000 && !hasStudiedToday();
};

// Calculate streak milestone奖励
export const getStreakMilestone = (streak: number): { title: string; reward: number } | null => {
  const milestones = [
    { streak: 3, title: '🔥 Three-Day Fire', reward: 25 },
    { streak: 7, title: '💪 Week Warrior', reward: 75 },
    { streak: 14, title: '🌟 Two-Week Star', reward: 150 },
    { streak: 30, title: '🏆 Monthly Master', reward: 300 },
    { streak: 60, title: '👑 Two-Month Champion', reward: 600 },
    { streak: 90, title: '🌈 Quarter Year Legend', reward: 900 },
    { streak: 365, title: '🎉 Year of Dedication', reward: 2000 }
  ];

  const milestone = milestones.find(m => m.streak === streak);
  if (milestone) {
    return { title: milestone.title, reward: milestone.reward };
  }
  return null;
};

// Reset streak (for testing)
export const resetStreak = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STREAK_KEY);
};


