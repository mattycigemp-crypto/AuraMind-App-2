import { useEffect } from 'react';
import { Capacitor } from '../lib/nativeShim';
import { useAppPreference } from '../lib/appPreferences';
import { buildReminderNotifications, REMINDER_IDS } from '../lib/reminderSchedule';
import { useLocalNotifications } from './useNative';

/**
 * Keep the OS's scheduled reminders in step with the user's preferences.
 *
 * WHY THIS RUNS AT APP START
 *
 * Reminder syncing used to live only in the two Settings screens, so the OS
 * was only ever corrected while a user happened to be looking at that page.
 * That was invisible until reminders were being scheduled wrongly: when the
 * missing `repeats` flag was fixed, every existing install kept its one-shot
 * alarms until the user next opened Settings — which, for someone who set
 * their reminder once months ago, is never.
 *
 * Anything that repairs state has to run where the state is used, not where
 * it is edited.
 *
 * WHY THE MODE ARGUMENT
 *
 * 'maintain' checks the permission and schedules only if it is already
 * granted. 'request' will raise the system dialog.
 *
 * The distinction matters: prompting for notifications the moment an app
 * opens is the fastest way to get permanently denied, and a permission
 * dialog on launch is not something the user asked for. So app start
 * maintains, and only an explicit toggle in Settings asks.
 */
export type ReminderSyncMode = 'maintain' | 'request';

export function useReminderSync(mode: ReminderSyncMode = 'maintain'): void {
  const [dailyReminder] = useAppPreference('auramind_dailyReminder', true);
  const [dueReminder] = useAppPreference('auramind_dueReminder', true);
  const [streakReminder] = useAppPreference('auramind_streakReminder', true);
  const [weeklySummary] = useAppPreference('auramind_weeklySummary', false);
  const [reminderTime] = useAppPreference('auramind_reminderTime', '09:00');

  const { requestPermissions, checkPermissions, schedule, cancel } = useLocalNotifications();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let abandoned = false;

    void (async () => {
      try {
        // Cancel first so a disabled reminder actually disappears, and so a
        // reminder whose shape changed (the repeats fix) is replaced rather
        // than left alongside the old alarm.
        await Promise.all(Object.values(REMINDER_IDS).map((id) => cancel(id)));
        if (abandoned) return;

        const notifications = buildReminderNotifications({
          dailyReminder,
          dueReminder,
          streakReminder,
          weeklySummary,
          reminderTime,
        });
        if (notifications.length === 0) return;

        const permission =
          mode === 'request' ? await requestPermissions() : await checkPermissions();
        if (permission !== 'granted' || abandoned) return;

        await Promise.all(notifications.map((notification) => schedule(notification)));
      } catch {
        // Reminders are a convenience. A missing permission or an unavailable
        // bridge must never interrupt whatever the user is actually doing.
      }
    })();

    return () => {
      abandoned = true;
    };
  }, [
    mode,
    dailyReminder,
    dueReminder,
    streakReminder,
    weeklySummary,
    reminderTime,
    requestPermissions,
    checkPermissions,
    schedule,
    cancel,
  ]);
}
