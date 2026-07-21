import {
  Home,
  BookOpen,
  Brain,
  MessageSquare,
  Activity,
  Settings,
  Shield,
  Sparkles,
  LayoutDashboard,
  Search,
  BellDot,
  Crown,
  Star,
  BadgeCheck,
  Database,
  ScrollText,
  DollarSign,
  Wrench,
  Key,
  Trophy,
  TrendingUp,
  Users,
  CreditCard,
  UserPlus,
  FileText,
  Monitor,
  Globe,
  ChevronRight,
  ListChecks,
  Store,
  Sliders,
} from "lucide-react";
import { useAuraMind } from "@/lib/auramind/store";
import type { ViewKey } from "@/lib/auramind/types";
import { useNavigate, useLocation } from "react-router-dom";
import { CogniWordmark } from "@/components/brand/CogniWordmark";
import { useDashboardWorkspace } from "@/contexts/DashboardWorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleBadgeConfig, isAdminOrHigher, isCeoOrHigher, isOwnerOnly } from "@/utils/permissions";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnreadCount,
  type AppNotification,
  type NotificationType,
} from "@/services/notifications/notificationStore";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";


interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { key: "noop", label: "Library", icon: BookOpen, path: "/dashboard/decks" },
  { key: "noop", label: "Generator", icon: Sparkles, path: "/dashboard/generator" },
  { key: "study", label: "Study", icon: Brain, path: "/dashboard/study" },
  { key: "chat", label: "AI Tutor", icon: MessageSquare, path: "/dashboard/chat" },
  { key: "noop", label: "Quiz Lab", icon: ListChecks, path: "/dashboard/quiz" },
  { key: "noop", label: "Analytics", icon: Activity, path: "/dashboard/analytics" },
  { key: "noop", label: "Achievements", icon: Trophy, path: "/dashboard/achievements" },
  { key: "noop", label: "Leaderboard", icon: TrendingUp, path: "/dashboard/leaderboard" },
  { key: "noop", label: "Leagues", icon: Crown, path: "/dashboard/leagues" },
  { key: "noop", label: "Marketplace", icon: Store, path: "/dashboard/marketplace" },
  { key: "noop", label: "Personalization", icon: Sliders, path: "/dashboard/personalization" },
  { key: "settings", label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin", label: "Overview", icon: Shield, path: "/admin/vault" },
  { key: "users", label: "Users", icon: Users, path: "/admin/users" },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard, path: "/admin/subscriptions" },
  { key: "test-users", label: "Test Users", icon: UserPlus, path: "/admin/test-users" },
  { key: "content", label: "Content", icon: FileText, path: "/admin/content" },
  { key: "flags", label: "Feature Flags", icon: Activity, path: "/admin/flags" },
  { key: "database", label: "Database", icon: Database, path: "/admin/database" },
  { key: "audit", label: "Audit Trail", icon: ScrollText, path: "/admin/audit" },
  { key: "preview", label: "Device Lab", icon: Monitor, path: "/admin/preview" },
  { key: "health", label: "Health Check", icon: Activity, path: "/admin/health" },
];

const CEO_NAV: NavItem[] = [
  { key: "revenue", label: "Revenue", icon: DollarSign, path: "/admin/revenue" },
  { key: "config", label: "System Config", icon: Wrench, path: "/admin/config" },
  { key: "nexus", label: "Nexus Command", icon: Globe, path: "/admin/nexus", badge: "WIP" },
];

const OWNER_NAV: NavItem[] = [
  { key: "roles", label: "Role Manager", icon: Key, path: "/admin/roles" },
];

const MOBILE_NAV: { key: ViewKey; label: string; icon: LucideIcon; path?: string }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { key: "study", label: "Study", icon: Brain, path: "/dashboard/study" },
  { key: "chat", label: "Tutor", icon: MessageSquare, path: "/dashboard/chat" },
  { key: "settings", label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const MOBILE_ADMIN_NAV: { key: ViewKey; label: string; icon: LucideIcon; path?: string }[] = [
  { key: "health", label: "Health", icon: Activity, path: "/admin/health" },
];

function Wordmark({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg">
          <img src="/favicons,logos/favicon-32.png" alt="AuraMind" className="h-full w-full object-contain" />
        </div>
        <span className="text-[15px] font-medium tracking-tight text-[#F0EFFE]">
          Aura<span className="font-serif italic text-violet-400">Mind</span>
        </span>
      </button>
      {/* CogniVect parent line lives BENEATH the AuraMind wordmark — never
          inline with it, never replacing it. Variant 'footnote' keeps the
          28px-tall logo strip from blowing out, while the VectorMark
          glyph communicates the cross-product family at a glance. */}
      <CogniWordmark variant="footnote" className="ml-[2rem] opacity-60" />
    </div>
  );
}

function NavButton({
  item,
  active,
  dueBadge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  dueBadge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
        active
          ? "bg-[#1A1A24] text-[#F0EFFE]"
          : "text-[#9090A8] hover:bg-[#111118] hover:text-[#F0EFFE]"
      }`}
    >
      {/* Active indicator — animated left border glow */}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-violet-500"
          style={{ boxShadow: "0 0 10px rgba(139,92,246,0.6), 0 0 20px rgba(139,92,246,0.3)" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
          {item.badge}
        </span>
      )}
      {dueBadge ? (
        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white animate-pulse">
          {dueBadge}
        </span>
      ) : null}
    </button>
  );
}

function isActivePath(path: string | undefined, currentPath: string): boolean {
  if (!path) return false;
  if (path === "/dashboard") return currentPath === "/dashboard";
  return currentPath.startsWith(path);
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const setCmdOpen = useAuraMind((s) => s.setCmdOpen);
  const navigate = useNavigate();
  const location = useLocation();

  const workspace = useDashboardWorkspace();
  const totalDue = workspace?.cards?.filter(c => c.nextReview <= Date.now()).length ?? 0;
  const roleBadge = getRoleBadgeConfig(workspace?.user?.role);
  const hasAdminAccess = isAdminOrHigher(workspace?.user?.role);

  // ─── Notification state ───
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const mobileBellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unsub = subscribeToNotifications((all) => {
      setNotifications(all);
      setUnreadCount(getUnreadCount());
    });
    return unsub;
  }, []);

  const handleBellClick = () => {
    setNotifPanelOpen(prev => !prev);
  };

  const handleNotifClick = (n: AppNotification) => {
    if (!n.read) markAsRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
    setNotifPanelOpen(false);
  };

  // Close panel on outside click
  useEffect(() => {
    if (!notifPanelOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !bellRef.current?.contains(target) &&
        !mobileBellRef.current?.contains(target) &&
        !target.closest('[data-notif-panel]')
      ) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifPanelOpen]);

  const notifTypeConfig = (type: NotificationType) => {
    const map: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
      success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
      warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    };
    return map[type] || map.info;
  };

  const notifTimeAgo = (ts: number): string => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    return `${Math.floor(hr / 24)}d`;
  };

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('auramind:sidebarSections');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('auramind:sidebarSections', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const activeView = (): ViewKey => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/landing")) return "landing";
    if (path === "/auth") return "auth";
    if (path.startsWith("/admin/health")) return "health";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/dashboard/chat")) return "chat";
    if (path.startsWith("/dashboard/settings") || path.startsWith("/settings")) return "settings";
    if (path.startsWith("/study") || path.startsWith("/dashboard/study")) return "study";
    return "dashboard";
  };

  const view = activeView();

  const handleClick = (item: NavItem) => {
    if (!item.path) return;
    navigate(item.path);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-[#F0EFFE]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#2A2A3A] bg-[#0A0A0F] md:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Wordmark />
          <button
            ref={bellRef}
            onClick={handleBellClick}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              notifPanelOpen
                ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                : 'border-[#2A2A3A] bg-[#111118] text-[#5A5A72] hover:border-violet-600/40 hover:text-violet-400'
            }`}
            aria-label="Notifications"
          >
            <BellDot className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#0A0A0F]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {PRIMARY_NAV.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              active={isActivePath(item.path, location.pathname)}
              dueBadge={item.key === "study" ? totalDue : undefined}
              onClick={() => handleClick(item)}
            />
          ))}

          <div className="my-2 h-px bg-[#2A2A3A]" />

          {/* Secondary nav — smaller, muted */}
          <NavButton
            item={{ key: "noop", label: "Tutorial", icon: FileText, path: "/dashboard/tutorial" }}
            active={isActivePath("/dashboard/tutorial", location.pathname)}
            onClick={() => navigate("/dashboard/tutorial")}
          />

          {hasAdminAccess && (
            <>
              <div className="my-3 h-px bg-[#2A2A3A]" />

              {/* ─── Admin section — collapsible ─── */}
              <button
                onClick={() => toggleSection('admin')}
                className="mb-1 px-3 w-full flex items-center justify-between text-[#5A5A72] text-[9px] font-semibold uppercase tracking-widest hover:text-[#9090A8] transition-colors group"
              >
                <span className="flex items-center gap-2">
                  Admin
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-600/10 text-violet-400 text-[8px] font-bold">{ADMIN_NAV.length}</span>
                </span>
                <motion.span
                  animate={{ rotate: collapsedSections['admin'] ? 0 : 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={12} className="text-[#5A5A72] group-hover:text-[#9090A8]" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {!collapsedSections['admin'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {ADMIN_NAV.map((item) => (
                      <NavButton
                        key={item.label}
                        item={item}
                        active={isActivePath(item.path, location.pathname)}
                        onClick={() => handleClick(item)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── CEO section — collapsible ─── */}
              {isCeoOrHigher(workspace?.user?.role) && (
                <>
                  <button
                    onClick={() => toggleSection('ceo')}
                    className="mt-3 mb-1 px-3 w-full flex items-center justify-between text-[#5A5A72] text-[9px] font-semibold uppercase tracking-widest hover:text-[#F0EFFE] transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      CEO
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] font-bold">{CEO_NAV.length}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: collapsedSections['ceo'] ? 0 : 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={12} className="text-[#5A5A72] group-hover:text-[#9090A8]" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {!collapsedSections['ceo'] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {CEO_NAV.map((item) => (
                          <NavButton
                            key={item.label}
                            item={item}
                            active={isActivePath(item.path, location.pathname)}
                            onClick={() => handleClick(item)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* ─── Owner section — collapsible ─── */}
              {isOwnerOnly(workspace?.user?.role) && (
                <>
                  <button
                    onClick={() => toggleSection('owner')}
                    className="mt-3 mb-1 px-3 w-full flex items-center justify-between text-[#5A5A72] text-[9px] font-semibold uppercase tracking-widest hover:text-[#F0EFFE] transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Owner
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[8px] font-bold">{OWNER_NAV.length}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: collapsedSections['owner'] ? 0 : 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={12} className="text-[#5A5A72] group-hover:text-[#9090A8]" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {!collapsedSections['owner'] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {OWNER_NAV.map((item) => (
                          <NavButton
                            key={item.label}
                            item={item}
                            active={isActivePath(item.path, location.pathname)}
                            onClick={() => handleClick(item)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </>
          )}

          <button
            onClick={() => setCmdOpen(true)}
            className="mt-3 flex items-center gap-3 rounded-xl border border-[#2A2A3A] bg-[#111118] px-3 py-2.5 text-sm text-[#5A5A72] transition-colors duration-150 hover:border-[#3A3A4F] hover:text-[#9090A8]"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded border border-[#2A2A3A] bg-[#1A1A24] px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* User block */}
        <div className="border-t border-[#2A2A3A] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <motion.div
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white shrink-0"
              style={roleBadge ? { boxShadow: roleBadge.avatarGlow } : undefined}
              animate={roleBadge?.animation === 'glow-pulse' ? { boxShadow: [roleBadge.avatarGlow, roleBadge.avatarGlowStrong, roleBadge.avatarGlow] } : undefined}
              transition={roleBadge?.animation === 'glow-pulse' ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
            >
              {(workspace?.user?.name || "U")[0].toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium text-[#F0EFFE]">
                {workspace?.user?.name || "User"}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                {roleBadge ? (
                  <motion.span
                    className={`relative overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadge.textColor} ring-1 ${roleBadge.ringColor} flex items-center gap-1`}
                    style={{ background: roleBadge.gradient }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {roleBadge.icon === 'crown' && <Crown className="h-2.5 w-2.5 shrink-0" />}
                    {roleBadge.icon === 'star' && <Star className="h-2.5 w-2.5 shrink-0" />}
                    {roleBadge.icon === 'shield' && <Shield className="h-2.5 w-2.5 shrink-0" />}
                    {roleBadge.icon === 'badge' && <BadgeCheck className="h-2.5 w-2.5 shrink-0" />}
                    <span>{roleBadge.label}</span>
                    {roleBadge.animation === 'shimmer' && (
                      <motion.span
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(90deg, transparent 0%, ${roleBadge.shimmerColor} 50%, transparent 100%)` }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      />
                    )}
                    {roleBadge.animation === 'glow-pulse' && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ background: roleBadge.shimmerColor }}
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    {roleBadge.animation === 'subtle-pulse' && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ background: roleBadge.shimmerColor }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.span>
                ) : (
                  <span className="rounded-full bg-violet-950 px-2 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-800">
                    {workspace?.user?.plan || "Starter"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#2A2A3A] bg-[#0A0A0F]/90 px-4 backdrop-blur md:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">
          <button
            ref={mobileBellRef}
            onClick={handleBellClick}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              notifPanelOpen
                ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                : 'border-[#2A2A3A] bg-[#111118] text-[#5A5A72] hover:border-violet-600/40 hover:text-violet-400'
            }`}
            aria-label="Notifications"
          >
            <BellDot className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#0A0A0F]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCmdOpen(true)}
            className="rounded-lg border border-[#2A2A3A] bg-[#111118] p-2 text-[#9090A8]"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#0A0A0F] pt-14 pb-20 md:pt-0 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 z-30 flex w-full items-center justify-around border-t border-[#2A2A3A] bg-[#0A0A0F]/95 px-2 py-2 backdrop-blur md:hidden">
        {[...MOBILE_NAV, ...(hasAdminAccess ? MOBILE_ADMIN_NAV : [])].map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => item.path && navigate(item.path)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors duration-150 ${
                active ? "text-violet-400" : "text-[#5A5A72]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Notification dropdown panel */}
      {notifPanelOpen &&
        createPortal(
          <div
            data-notif-panel
            className="fixed z-[100] w-80 max-h-[420px] overflow-auto rounded-2xl border border-[#2A2A3A] bg-[#0E0E15] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
            style={{
              top: 60,
              right: Math.max(16, window.innerWidth - (window.innerWidth >= 768 ? 256 : 0) - 336),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A3A]">
              <h3 className="text-sm font-semibold text-[#F0EFFE]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 uppercase tracking-wider transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 px-4">
                <BellDot className="w-8 h-8 text-[#3A3A4F]" />
                <p className="text-sm text-[#5A5A72]">No notifications yet</p>
                <p className="text-[10px] text-[#3A3A4F]">Quizzes, study reminders, and updates appear here</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.slice(0, 20).map((n) => {
                  const tc = notifTypeConfig(n.type);
                  const Icon = tc.icon;
                  return (
                    <div key={n.id} className="group relative">
                      <div
                        onClick={() => handleNotifClick(n)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNotifClick(n);
                          }
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#111118] cursor-pointer ${
                          n.read ? 'opacity-50' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tc.bg}`}>
                          <Icon className={`w-4 h-4 ${tc.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium truncate ${
                              n.read ? 'text-[#5A5A72]' : 'text-[#F0EFFE]'
                            }`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-[#5A5A72] shrink-0 mt-0.5">
                              {notifTimeAgo(n.timestamp)}
                            </span>
                          </div>
                          {n.description && (
                            <p className="text-xs text-[#5A5A72] mt-0.5 line-clamp-2">
                              {n.description}
                            </p>
                          )}
                          {n.actionLabel && (
                            <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider ${tc.color}`}>
                              {n.actionLabel} →
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(n.id);
                          }}
                          className="shrink-0 p-1 rounded-md text-[#3A3A4F] hover:text-[#9090A8] hover:bg-[#1A1A24] opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mx-4 h-px bg-[#1A1A24] last:hidden" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
