import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboardIcon as LayoutDashboard,
  LayersIcon as Layers,
  BotIcon as Bot,
  BookOpenIcon as BookOpen,
  SettingsIcon as Settings,
  CpuIcon as Cpu,
  FileTextIcon as FileText,
  PlayIcon as Play,
  ActivityIcon as Activity,
  GraduationCapIcon as GraduationCap,
  SparklesIcon as Sparkles,
  TargetIcon as Target,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
} from '../icons/CustomIcons';

interface SidebarProps {
  activeItem?: string;
  className?: string;
  onNavigate?: (id: string) => void;
  onQuickStudy?: () => void;
  studyDisabled?: boolean;
  badgeCounts?: Record<string, number>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'dashboard',
  className,
  onNavigate,
  onQuickStudy,
  studyDisabled,
  badgeCounts,
  isCollapsed = false,
  onToggleCollapse,
  userRole = 'user'
}) => {
  const navigate = useNavigate();

  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'cards', label: 'Cards & Decks', icon: Layers },
    { id: 'chat', label: 'AI Chat', icon: Bot },
    { id: 'generator', label: 'Generator', icon: Sparkles },

    { id: 'paths', label: 'Paths', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'tutorial', label: 'Tutorial', icon: GraduationCap },
    ...(userRole === 'admin' || userRole === 'owner' ? [{ id: 'admin', label: 'Admin Panel', icon: Cpu }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full border-r border-zinc-200 dark:border-primary/10 bg-white dark:bg-zinc-950/98 backdrop-blur-3xl flex flex-col py-8 px-0 z-50 transition-all duration-500 ease-in-out',
        isCollapsed ? 'w-20' : 'w-[280px]',
        className
      )}
      style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}
    >
      {/* Background Texture */}
      <div className="arch-grid-overlay absolute inset-0 opacity-[0.03] pointer-events-none" />
      
      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-black transition-all z-50 shadow-xl"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo Section */}
      <div className={cn("px-6 mb-12 relative z-10 transition-all duration-500", isCollapsed ? "flex justify-center" : "")}>
        <button
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          className="text-left group outline-none"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0">
               A
             </div>
             {!isCollapsed && (
               <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                 <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter font-impact-lg uppercase leading-none">
                   AuraMind
                 </h1>
                 <p className="text-[8px] font-black tracking-[0.4em] text-primary/40 mt-1 uppercase">
                   Neural Interface
                 </p>
               </div>
             )}
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 relative z-10" aria-label="Main">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const badgeCount = badgeCounts?.[item.id] || 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              title={isCollapsed ? item.label : undefined}
className={cn(
                'w-full flex items-center rounded-xl transition-all duration-300 group outline-none relative overflow-hidden',
                isCollapsed ? 'justify-center py-3' : 'gap-4 px-4 py-3.5',
                isActive
                  ? 'bg-primary/10 text-zinc-900 dark:text-primary border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]'
                  : 'text-zinc-700 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              )}
              
              <Icon className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
              
              {!isCollapsed && (
                <span className="flex-1 text-left text-[11px] font-black uppercase tracking-[0.15em] animate-in fade-in slide-in-from-left-1 duration-300">
                  {item.label}
                </span>
              )}

              {badgeCount > 0 && (
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center rounded-full bg-cosmic text-[9px] font-black text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse",
                  isCollapsed ? "absolute top-2 right-2 w-2 h-2 text-[0px]" : "w-5 h-5"
                )}>
                  {isCollapsed ? '' : (badgeCount > 99 ? '99+' : badgeCount)}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-4 mt-auto space-y-6 pb-8 relative z-10">
        <button
          type="button"
          onClick={() => {
            if (!studyDisabled) onQuickStudy?.();
          }}
          disabled={studyDisabled}
          className={cn(
            "btn-arch w-full group overflow-hidden transition-all duration-500 px-0",
            isCollapsed ? "h-12 rounded-xl" : "rounded-2xl h-14"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-cosmic opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-center gap-3">
             <Play className={cn("transition-transform duration-500 group-hover:translate-x-1", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
             {!isCollapsed && <span className="animate-in fade-in slide-in-from-bottom-1 duration-500">Initiate Study</span>}
          </div>
        </button>

        <div className={cn("space-y-1 pt-4 border-t border-primary/10 transition-all", isCollapsed ? "flex flex-col items-center" : "")}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin')}
            className={cn(
              "w-full flex items-center text-zinc-600 dark:text-zinc-500 hover:text-primary transition-all duration-300 group rounded-lg py-2",
              isCollapsed ? "justify-center" : "gap-3 px-2"
            )}
          >
            <Cpu className="w-4 h-4 shrink-0 group-hover:rotate-45 transition-transform" />
            {!isCollapsed && <span className="text-[9px] font-black tracking-[0.2em] uppercase">System Core</span>}
          </button>
          <button
            type="button"
            onClick={() => navigate('/docs')}
            className={cn(
              "w-full flex items-center text-zinc-600 dark:text-zinc-500 hover:text-primary transition-all duration-300 group rounded-lg py-2",
              isCollapsed ? "justify-center" : "gap-3 px-2"
            )}
          >
            <FileText className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="text-[9px] font-black tracking-[0.2em] uppercase">Log Archive</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;



