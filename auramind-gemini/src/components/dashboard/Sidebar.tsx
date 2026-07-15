import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, Zap, Sparkles, TrendingUp, Settings, Shield, Heart, Search, Trophy } from 'lucide-react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { isAdminOrHigher } from '../../utils/permissions';


const USER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'decks', label: 'Library', icon: Library, path: '/dashboard/decks' },
  { id: 'study', label: 'Study', icon: Zap, path: '/dashboard/study' },
  { id: 'chat', label: 'AI Tutor', icon: Sparkles, path: '/dashboard/chat' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, path: '/dashboard/achievements' },
  { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp, path: '/dashboard/leaderboard' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

const ADMIN_NAV_ITEMS = [
  { id: 'admin', label: 'Admin', icon: Shield, path: '/admin/vault' },
  { id: 'health', label: 'Health Check', icon: Heart, path: '/admin/health' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = React.useRef<HTMLDivElement>(null);
  const workspace = useDashboardWorkspace();
  
  // Real due count from actual cards (no mock)
  const dueCount = useMemo(() => {
    if (!workspace?.cards) return 0;
    return workspace.cards.filter(c => c.nextReview <= Date.now()).length;
  }, [workspace?.cards]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('#sidebar-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          const input = document.querySelector<HTMLInputElement>('input[placeholder="Search decks or cards..."]');
          input?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-[#0A0A0F] border-r border-[#2A2A3A]/50 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-[#2A2A3A]/30">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center">
            <img src="/favicons,logos/icon-192.svg" alt="AuraMind" className="h-full w-full object-contain" />
          </div>
          <span className="text-[#F0EFFE] text-sm font-medium tracking-tight">AuraMind</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {useMemo(
          () => isAdminOrHigher(workspace?.user?.role) ? [...USER_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : USER_NAV_ITEMS,
          [workspace?.user?.role]
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-[#7C3AED]/10 text-[#8B5CF6]'
                  : 'text-[#5A5A72] hover:text-[#F0EFFE] hover:bg-[#111118]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={15} />
                <span>{item.label}</span>
              </div>
              {item.id === 'study' && dueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#7C3AED]/15 text-[#8B5CF6] text-[10px] font-medium">
                  {dueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Search */}
      <div className="px-3 pb-4 border-t border-[#2A2A3A]/30 pt-4">
        <div
          ref={searchInputRef}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111118] border border-[#2A2A3A]/50 text-[#5A5A72] text-xs cursor-pointer hover:border-[#3A3A4F] transition-colors"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder="Search decks or cards..."]');
            input?.focus();
          }}
        >
          <Search size={14} />
          <span className="flex-1">Search</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A24] border border-[#2A2A3A]">Ctrl+K</span>
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 text-[#5A5A72] text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active</span>
        </div>
      </div>
    </aside>
  );
}
