/**
 * notificationService.ts
 * Implements basic Web Notification API for study reminders.
 */

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      // Browser does not support desktop notifications
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  scheduleStudyReminder: (cardsDue: number) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      // In a real PWA context with Service Workers, we would schedule
      // a background notification here (e.g. periodically checking server).
      // For this MVP, if the app is still open contextually, or to show 
      // the capability, we just fire it natively.
      if (cardsDue > 0) {
        new Notification('AuraMind Study Reminder', {
          body: `You have ${cardsDue} card(s) due today. Your AI noticed you forgot something!`,
          icon: '/favicon.ico',
        });
      }
    }
  }
};



