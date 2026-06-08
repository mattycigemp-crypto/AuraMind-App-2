import React, { useState, useEffect } from 'react';
import { BellIcon as Bell, ChevronDownIcon as ChevronDown, XIcon as X, CheckCircle2Icon as CheckCircle2, AlertTriangleIcon as AlertTriangle, MessageSquareWarningIcon as MessageSquareWarning, InfoIcon as Info } from '../../icons/CustomIcons';
import { cn } from '../../../lib/utils';

interface Notification {
  id: string;
  title: string;
  description?: string;
  timestamp: number; // Unix timestamp
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  className?: string;
  onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Weekly progress report',
      description: 'You studied 3 days this week, which is above your average!',
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      read: false,
      type: 'info',
      action: {
        label: 'View Details',
        onClick: () => {
          // Handle action
          console.log('View details clicked');
        }
      }
    },
    {
      id: '2',
      title: 'New feature available',
      description: 'AI-powered quiz generation is now live in AI Chat',
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      read: true,
      type: 'success',
      action: {
        label: 'Try Now',
        onClick: () => {
          // Handle action
          console.log('Try now clicked');
        }
      }
    },
    {
      id: '3',
      title: 'Study reminder',
      description: 'You have 5 cards due for review today',
      timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      read: false,
      type: 'warning',
      action: {
        label: 'Start Study',
        onClick: () => {
          // Handle action
          console.log('Start study clicked');
        }
      }
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>( 'all');

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const getTypeConfig = (type: Notification['type']) => {
    const config: Record<string, { bgColor: string; textColor: string; borderColor: string; icon: React.ComponentType<{ className?: string }> }> = {
      info: { bgColor: 'bg-blue-500/10', textColor: 'text-blue-500', borderColor: 'border-blue-500/20', icon: Info },
      success: { bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/20', icon: CheckCircle2 },
      warning: { bgColor: 'bg-amber-500/10', textColor: 'text-amber-500', borderColor: 'border-amber-500/20', icon: MessageSquareWarning },
      error: { bgColor: 'bg-red-500/10', textColor: 'text-red-500', borderColor: 'border-red-500/20', icon: AlertTriangle }
    };
    
    return config[type] || config.info;
  };

  const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'just now';
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={`${className} fixed right-4 top-16 z-50 w-64`}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Bell className="w-5 h-5 text-primary" />
          {notifications.filter(n => !n.read).length > 0 && (
            <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {notifications.filter(n => !n.read).length > 99 ? '99+' : notifications.filter(n => !n.read).length}
            </div>
          )}
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-primary/20 bg-zinc-950/98 shadow-2xl z-50">
            <div className="flex justify-between items-start px-4 py-3 border-b border-primary/10">
              <h3 className="text-sm font-semibold text-primary">Notifications</h3>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2 py-1 rounded 
                           ${filter === 'all' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-100'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-2 py-1 rounded 
                           ${filter === 'unread' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-100'}`}
                >
                  Unread ({notifications.filter(n => !n.read).length})
                </button>
              </div>
            </div>
            
            <div className="space-y-2 px-4 pb-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-6 text-zinc-500">
                  {filter === 'all' 
                    ? 'No notifications' 
                    : 'No unread notifications'}
                </div>
              ) : (
                <>
                  {filteredNotifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-3 
                               ${notification.read ? 'bg-zinc-50' : 'bg-primary/5'} 
                               rounded-lg border-l-2 
                               ${notification.read ? 'border-transparent' : 'border-primary'} 
                               transition-all duration-200
                               hover:bg-zinc-100`}
                    >
                      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg">
                        {React.createElement(getTypeConfig(notification.type).icon, {
                          className: `h-5 w-5 ${getTypeConfig(notification.type).textColor}`
                        })}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-zinc-100">{notification.title}</h4>
                          <p className="text-xs text-zinc-400">{timeAgo(notification.timestamp)}</p>
                        </div>
                        {notification.description && (
                          <p className="text-xs text-zinc-300 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        {notification.action && (
                          <button
                            onClick={notification.action.onClick}
                            className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold 
                                     ${getTypeConfig(notification.type).textColor}
                                     border border-${getTypeConfig(notification.type).textColor}/20
                                     hover:bg-${getTypeConfig(notification.type).textColor}/10`}
                          >
                            {notification.action.label}
                          </button>
                        )}
                      </div>
                      <div className="flex-shrink-0 space-y-2">
                        <button
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsOpen(false); // Close after action
                          }}
                          className="p-1 rounded hover:bg-primary/10 text-zinc-400"
                          aria-label="Mark as read"
                        >
                          {!notification.read && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded hover:bg-primary/10 text-zinc-400"
                          aria-label="Delete"
                        >
                          <X className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-primary/10">
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setIsOpen(false);
                      }}
                      className="w-full text-center text-xs font-medium text-primary hover:text-primary/80"
                    >
                      Mark all as read
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;


