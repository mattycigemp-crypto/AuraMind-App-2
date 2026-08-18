import { describe, expect, it } from "vitest";
import { buildReminderNotifications, REMINDER_IDS } from "../lib/reminderSchedule";

describe("reminder schedule", () => {
  it("builds only enabled reminders at predictable offsets", () => {
    const notifications = buildReminderNotifications({
      dailyReminder: true,
      dueReminder: true,
      streakReminder: false,
      weeklySummary: true,
      reminderTime: "23:50",
    });

    expect(notifications.map(({ id }) => id)).toEqual([
      REMINDER_IDS.daily,
      REMINDER_IDS.due,
      REMINDER_IDS.weekly,
    ]);
    expect(notifications[0].schedule.on).toEqual({ hour: 23, minute: 50 });
    expect(notifications[1].schedule.on).toEqual({ hour: 0, minute: 5 });
    expect(notifications[2].schedule.on).toEqual({
      weekday: 2,
      hour: 0,
      minute: 35,
    });
  });

  it("returns no schedules for an invalid clock value", () => {
    expect(
      buildReminderNotifications({
        dailyReminder: true,
        dueReminder: true,
        streakReminder: true,
        weeklySummary: true,
        reminderTime: "25:99",
      }),
    ).toEqual([]);
  });
});
