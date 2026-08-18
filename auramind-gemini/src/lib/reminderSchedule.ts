export const REMINDER_IDS = {
  daily: 7401,
  due: 7402,
  streak: 7403,
  weekly: 7404,
} as const;

export interface ReminderPreferences {
  dailyReminder: boolean;
  dueReminder: boolean;
  streakReminder: boolean;
  weeklySummary: boolean;
  reminderTime: string;
}

export interface ScheduledReminder {
  id: number;
  title: string;
  body: string;
  schedule: {
    on: {
      weekday?: number;
      hour: number;
      minute: number;
    };
  };
}

function timeWithOffset(hour: number, minute: number, offsetMinutes: number) {
  const total = (hour * 60 + minute + offsetMinutes) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

/** Build only the notifications the user enabled; invalid times produce none. */
export function buildReminderNotifications({
  dailyReminder,
  dueReminder,
  streakReminder,
  weeklySummary,
  reminderTime,
}: ReminderPreferences): ScheduledReminder[] {
  const [hour, minute] = reminderTime.split(":").map(Number);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return [];
  }

  const notifications: ScheduledReminder[] = [];
  if (dailyReminder) {
    notifications.push({
      id: REMINDER_IDS.daily,
      title: "AuraMind study reminder",
      body: "Your review queue is ready. Keep your memory curve sharp.",
      schedule: { on: timeWithOffset(hour, minute, 0) },
    });
  }
  if (dueReminder) {
    notifications.push({
      id: REMINDER_IDS.due,
      title: "AuraMind due cards",
      body: "You have cards waiting for a quick review.",
      schedule: { on: timeWithOffset(hour, minute, 15) },
    });
  }
  if (streakReminder) {
    notifications.push({
      id: REMINDER_IDS.streak,
      title: "Protect your AuraMind streak",
      body: "A short session tonight keeps your rhythm intact.",
      schedule: { on: timeWithOffset(hour, minute, 30) },
    });
  }
  if (weeklySummary) {
    notifications.push({
      id: REMINDER_IDS.weekly,
      title: "Your AuraMind week",
      body: "Take a minute to see what you strengthened this week.",
      schedule: { on: { weekday: 2, ...timeWithOffset(hour, minute, 45) } },
    });
  }
  return notifications;
}
