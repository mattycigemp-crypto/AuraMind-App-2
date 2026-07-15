import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminAnalytics from './AdminAnalytics';
import AdminContent from './AdminContent';
import DatabaseExplorer from './DatabaseExplorer';
import AuditLog from './AuditLog';

// Icons
import {
  LayoutDashboardIcon as LayoutDashboard,
  UsersIcon as Users,
  CreditCardIcon as CreditCard,
  ActivityIcon as Activity,
  FileTextIcon as FileText,
  ShieldIcon as Shield,
  DatabaseIcon as Database,
  SearchIcon as Search,
  XIcon as X,
  ChevronRightIcon as ChevronRight,
  BrainCircuitIcon as BrainCircuit,
  ZapIcon as Zap,
} from '../../components/icons/CustomIcons';

// --- Types ---
export type AdminSection = 'overview' | 'users' | 'subscriptions' | 'analytics' | 'content' | 'database' | 'audit';

interface AdminDashboardProps {
  className?: string;
  onBackToDashboard?: () => void;
}

// --- Animated Nebula Background ---
const NebulaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Nebula particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      hue: number;
      alpha: number;
      pulse: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 200 + 80,
        hue: Math.random() * 60 + 250, // Purple-blue range
        alpha: Math.random() * 0.06 + 0.02,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.005 + 0.002,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render nebula blobs
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < -200) p.x = canvas.width + 200;
        if (p.x > canvas.width + 200) p.x = -200;
        if (p.y < -200) p.y = canvas.height + 200;
        if (p.y > canvas.height + 200) p.y = -200;

        const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.008)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
};

// --- Section Metadata ---
interface SectionMeta {
  title: string;
  description: string;
  icon: React.FC<{ className?: string; size?: number }>;
  badge?: string;
}

const sectionMetaMap: Record<AdminSection, SectionMeta> = {
  overview: { title: 'Command Center', description: 'Real-time platform telemetry & health monitoring', icon: LayoutDashboard },
  users: { title: 'User Registry', description: 'Identity management, roles, and account oversight', icon: Users },
  subscriptions: { title: 'Revenue Hub', description: 'Subscription analytics and billing intelligence', icon: CreditCard },
  analytics: { title: 'Growth Analytics', description: 'Adoption metrics, retention cohorts, engagement', icon: Activity },
  content: { title: 'Content Library', description: 'Knowledge base metrics across all users', icon: FileText },
  database: { title: 'SQL Explorer', description: 'Direct Supabase query console', icon: Database, badge: 'ADVANCED' },
  audit: { title: 'Audit Trail', description: 'Administrative action log & system events', icon: Shield },
};

// --- Sidebar ---
const AdminSidebar: React.FC<{
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBackToDashboard?: () => void;
}> = ({ activeSection, onSectionChange, collapsed, onToggleCollapse, onBackToDashboard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const sections = useMemo(() => {
    const entries = Object.entries(sectionMetaMap) as [AdminSection, SectionMeta][];
    if (!searchQuery) return entries;
    return entries.filter(
      ([, meta]) =>
        meta.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative h-screen bg-zinc-950/80 backdrop-blur-3xl border-r border-zinc-700/30 flex flex-col z-50 shrink-0 overflow-hidden"
    >
      {/* Glass edge glow */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

      {/* Header */}
      <div className={cn("p-5 flex items-center gap-3 border-b border-zinc-700/30", collapsed && "justify-center p-3")}>
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <BrainCircuit size={18} className="text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Admin Nexus</p>
            <p className="text-[9px] text-zinc-500 font-medium tracking-wider">SYSTEM CONTROL</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "ml-auto p-1.5 rounded-lg hover:bg-zinc-900/20 text-zinc-500 hover:text-zinc-300 transition-all",
            collapsed && "ml-0"
          )}
        >
          <ChevronRight
            size={14}
            className={cn("transition-transform duration-300", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Quick Search */}
      {!collapsed && (
        <div className="px-3 pt-3">
          {searchOpen ? (
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to section..."
                className="w-full pl-8 pr-7 py-2 bg-zinc-900/10 border border-zinc-700/30 rounded-xl text-[11px] text-zinc-300 focus:outline-none focus:border-primary/30 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                }}
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900/10 border border-zinc-700/30 rounded-xl text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50 transition-all"
            >
              <Search size={12} />
              <span>Quick search...</span>
              <span className="ml-auto text-[8px] text-zinc-600 font-mono">⌘K</span>
            </button>
          )}
        </div>
      )}

      {/* Back to User Dashboard */}
      {!collapsed && onBackToDashboard && (
        <div className="px-3 pt-1 pb-2">
          <button
            onClick={onBackToDashboard}
            className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900/10 border border-zinc-700/30 rounded-xl text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50 transition-all"
          >
            <ChevronRight size={12} className="rotate-180" />
            <span>Exit Admin &raquo;</span>
          </button>
        </div>
      )}
      {collapsed && onBackToDashboard && (
        <div className="flex justify-center py-1">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-zinc-900/10 border border-zinc-700/30 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50 transition-all"
            title="Back to Dashboard"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sections.map(([id, meta]) => {
          const Icon = meta.icon;
          const isActive = activeSection === id;
          return (
            <motion.button
              key={id}
              onClick={() => onSectionChange(id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'w-full flex items-center gap-3 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden',
                collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
                isActive
                  ? 'bg-primary/10 border border-primary/20 text-primary shadow-[0_0_20px_rgba(168,85,247,0.06)]'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20 border border-transparent'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-cosmic"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className={cn(
                "shrink-0 flex items-center justify-center",
                collapsed ? "w-9 h-9" : "w-8 h-8"
              )}>
                <Icon
                  size={collapsed ? 18 : 16}
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-wide truncate">{meta.title}</span>
                    {meta.badge && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-[0.1em] uppercase">
                        {meta.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-600 truncate mt-0.5">{meta.description}</p>
                </div>
              )}

              {!collapsed && isActive && (
                <Zap size={12} className="text-primary/60 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-700/30">
          <div className="p-3 rounded-2xl bg-zinc-900/10 border border-zinc-700/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">System Online</p>
            </div>
            <p className="text-[8px] text-zinc-600 leading-relaxed">
              Admin Nexus v3.0 · Supabase Connected · All systems nominal
            </p>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// --- Main Dashboard Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({ className, onBackToDashboard }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const meta = sectionMetaMap[activeSection];

  const sectionComponents: Record<AdminSection, React.FC<{ className?: string }>> = {
    overview: AdminOverview,
    users: AdminUsers,
    subscriptions: AdminSubscriptions,
    analytics: AdminAnalytics,
    content: AdminContent,
    database: DatabaseExplorer,
    audit: AuditLog,
  };

  const SectionComponent = sectionComponents[activeSection];

  return (
    <div className={cn("relative flex h-screen bg-zinc-950 overflow-hidden", className)}>
      {/* Animated Background */}
      <NebulaBackground />

      {/* Radial vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />

      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Top Bar */}
        <header className="h-16 shrink-0 border-b border-zinc-700/30 flex items-center px-6 gap-4 backdrop-blur-xl bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <meta.icon size={18} className="text-primary/70" />
            <div>
              <h1 className="text-[13px] font-black text-white uppercase tracking-[0.15em]">{meta.title}</h1>
              <p className="text-[9px] text-zinc-500 font-medium tracking-wider">{meta.description}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live clock */}
            <LiveClock />
            <div className="w-px h-6 bg-zinc-900/20" />
            <SystemStatus />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 md:p-8 max-w-[1800px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -12 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              >
                <SectionComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Live Clock ---
const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-zinc-500">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse" />
      <span className="text-[10px] font-mono font-bold tracking-wider">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </span>
    </div>
  );
};

// --- System Status ---
const SystemStatus: React.FC = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/10 border border-zinc-700/30">
    <span className="text-[9px] text-zinc-500 font-bold tracking-wider">ALL SYSTEMS OPERATIONAL</span>
    <div className="flex gap-1">
      <div className="w-1 h-1 rounded-full bg-green-400" />
      <div className="w-1 h-1 rounded-full bg-green-400" />
      <div className="w-1 h-1 rounded-full bg-green-400/60" />
    </div>
  </div>
);

export { AdminDashboard, AdminSidebar, sectionMetaMap };
export default AdminDashboard;



