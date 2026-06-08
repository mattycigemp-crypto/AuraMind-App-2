import React, { useMemo, useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';
import {
  SearchIcon as Search,
  MenuIcon as Menu,
  LogOutIcon as LogOut,
  ChevronDownIcon as ChevronDown,
  BellIcon as Bell,
  UserIcon as User,
  SettingsIcon as Settings,
  SparklesIcon as Sparkles,
  AlertTriangleIcon as AlertTriangle,
  CheckCircle2Icon as CheckCircle2,
  XIcon as X,
  InfoIcon as Info,
  TargetIcon as Target,
  SunIcon as Sun,
  MoonIcon as Moon,
} from '../icons/CustomIcons';
import MiiCharacter, { CHARACTER_PRESETS } from '../shared/MiiCharacter';
import type { DicebearOptions } from '../shared/MiiCharacter';
import { useTheme } from '../../hooks/useTheme';
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnreadCount,
  type AppNotification,
  type NotificationType,
} from '../../services/notifications/notificationStore';

interface SavedCustomCharacter {
  id: string;
  name: string;
  options: DicebearOptions;
}

export interface TopAppBarProps {
  className?: string;
  userName: string;
  userEmail: string;
  planLabel: string;
  onLogout: () => void;
  onMobileMenuClick?: () => void;
  /** Deck titles for quick search (client-side filter) */
  searchItems?: { id: string; label: string; href: string }[];
  onNavigate?: (path: string) => void;
  characterId?: string;
  customCharacters?: SavedCustomCharacter[];
  uploadedImage?: string | null;
}

const TopAppBar: React.FC<TopAppBarProps> = ({
  className,
  userName,
  userEmail,
  planLabel,
  onLogout,
  onMobileMenuClick,
  searchItems = [],
  onNavigate,
  characterId,
  customCharacters,
  uploadedImage,
}) => {
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, resolvedTheme, cycleTheme } = useTheme();

  useEffect(() => {
    const unsub = subscribeToNotifications(setNotifications);
    return unsub;
  }, []);

  const unreadCount = getUnreadCount();
  const displayed = notifications.slice(0, 5);

  const typeConfig = (type: NotificationType) => {
    const map: Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
      success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      error:   { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
      warning: { icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      info:    { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    };
    return map[type] || map.info;
  };

  const timeAgo = (ts: number): string => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    return `${Math.floor(hr / 24)}d`;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || searchItems.length === 0) return [];
    return searchItems.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, searchItems]);

  const customId = characterId || 'matt';
  const customChar = customCharacters?.find(c => c.id === customId);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 md:left-[280px] min-h-16 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-200 dark:border-primary/10 flex justify-between items-center px-4 md:px-8 z-40 transition-all duration-300',
        className
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Subtle grid line for header */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-50" />

      <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0 relative z-10">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMobileMenuClick}
          className="md:hidden shrink-0 p-2.5 rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-all active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-xl group">
          <div className="flex items-center gap-3 bg-primary/[0.04] border border-primary/15 px-4 py-2 rounded-xl group-focus-within:border-primary/40 group-focus-within:bg-primary/[0.08] group-focus-within:shadow-[0_0_20px_rgba(168,85,247,0.05)] transition-all duration-300">
            <Search className="text-primary/50 shrink-0 w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input
              aria-label="Search decks"
              className="bg-transparent border-none focus:ring-0 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 w-full outline-none font-medium"
              placeholder="Search neural workspace…"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <div
              className="absolute left-0 right-0 mt-3 py-2 rounded-2xl border border-primary/20 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] z-50 max-h-80 overflow-auto animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="px-4 py-2 text-[9px] font-black text-primary/40 uppercase tracking-[0.25em] border-b border-primary/5 mb-1">
                Neural Match
              </div>
              <ul role="listbox">
                {filtered.map((item) => (
                  <li key={item.id} role="option">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-primary/10 transition-all flex items-center gap-4 group/item"
                      onClick={() => {
                        onNavigate?.(item.href);
                        setQuery('');
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover/item:bg-primary group-hover/item:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 shrink-0 ml-4 relative z-10">
        {/* Theme Toggle */}
        <button
          type="button"
          aria-label={`Theme: ${theme} (currently ${resolvedTheme})`}
          onClick={cycleTheme}
          title={`Theme: ${theme} — click for ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'}`}
          className="relative p-2.5 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/5 text-primary/60 hover:text-primary transition-all duration-300"
        >
          {resolvedTheme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === 'system' && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-zinc-950" title="Auto" />
          )}
        </button>

        {/* Notifications */}
        <DropdownMenu.Root open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative hidden sm:flex p-2.5 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/5 text-primary/60 hover:text-primary transition-all duration-300 group data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5 data-[state=open]:text-primary"
            >
              <Bell className="w-5 h-5 group-hover:animate-bounce-subtle" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-cosmic text-[9px] font-black text-white shadow-[0_0_12px_rgba(168,85,247,0.9)] animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={`w-80 p-2 rounded-2xl border border-primary/20 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[420px] overflow-auto ${
                resolvedTheme === 'dark' 
                  ? 'bg-zinc-950/98 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]' 
                  : 'bg-white/98 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)]'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-3 border-b border-primary/10 mb-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[10px] font-semibold text-primary/60 hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell className="w-8 h-8 text-zinc-500 dark:text-zinc-700" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">No notifications yet</p>
                </div>
              ) : (
                displayed.map((n) => {
                  const tc = typeConfig(n.type);
                  const Icon = tc.icon;
                  return (
                    <DropdownMenu.Item
                      key={n.id}
                      className={`flex items-start gap-3 px-3 py-3 rounded-xl outline-none cursor-pointer transition-all group/item ${n.read ? 'opacity-60' : 'bg-primary/[0.03]'}`}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (!n.read) markAsRead(n.id);
                        if (n.actionUrl && onNavigate) {
                          onNavigate(n.actionUrl);
                          setNotifOpen(false);
                        }
                      }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tc.bg}`}>
                        <Icon className={`w-4 h-4 ${tc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${n.read ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">{timeAgo(n.timestamp)}</span>
                        </div>
                        {n.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2">{n.description}</p>
                        )}
                        {!n.read && (
                          <div className="mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${tc.color} hover:underline`}>
                              {n.actionLabel || 'View'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="shrink-0 p-1 rounded-md text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover/item:opacity-100 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </DropdownMenu.Item>
                  );
                })
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Account Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-3 rounded-2xl py-1.5 pr-1.5 pl-3 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 outline-none group data-[state=open]:bg-primary/5"
            >
              <div className="hidden sm:block text-right max-w-[140px]">
                <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">{userName}</p>
                <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{planLabel}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[inset_0_0_10px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all overflow-hidden relative">
                {uploadedImage && customId === 'uploaded' ? (
                  <img src={uploadedImage} alt="" className="w-full h-full object-cover" />
                ) : customChar ? (
                  <MiiCharacter seed={customChar.id} size={40} dicebear={customChar.options} />
                ) : (
                  <MiiCharacter seed={CHARACTER_PRESETS.find(c => c.id === customId)?.seed || 'Matt'} size={40} />
                )}
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-zinc-600 group-data-[state=open]:rotate-180 transition-transform duration-300" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-72 p-2 rounded-2xl border border-primary/20 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="px-4 py-4 mb-2 border-b border-primary/10">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{userName}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">{userEmail}</p>
                <div className="inline-flex mt-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                  {planLabel} Neural Tier
                </div>
              </div>

              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-primary/10 hover:text-black dark:hover:text-white outline-none cursor-pointer transition-all group">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                </div>
                Profile Command
              </DropdownMenu.Item>
              
              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-primary/10 hover:text-black dark:hover:text-white outline-none cursor-pointer transition-all group">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Settings className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                </div>
                Neural Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-primary/10 my-2 mx-2" />

              <DropdownMenu.Item
                className="flex items-center gap-3 px-3 py-3 text-sm text-red-400 rounded-xl hover:bg-red-500/10 outline-none cursor-pointer transition-all group"
                onSelect={onLogout}
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                Terminate Session
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};

export default TopAppBar;



