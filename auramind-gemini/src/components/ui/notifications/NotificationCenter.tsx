import React from 'react';

interface NotificationCenterProps {
  className?: string;
  onClose?: () => void;
}

// Deprecated — notifications are now handled via AppShell bell button + notificationStore.
// Use addNotification() from @/services/notifications/notificationStore instead.
const NotificationCenter: React.FC<NotificationCenterProps> = () => {
  return null;
};

export default NotificationCenter;
