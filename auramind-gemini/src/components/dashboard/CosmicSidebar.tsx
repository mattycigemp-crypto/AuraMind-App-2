import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../../types';
import {
  BrainCircuit,
  Crown,
  FileText,
  LayoutGrid,
  Layers,
  Zap,
  Activity,
  Settings,
  LogOut,
  BookOpen,
  Plus,
  Compass,
  Shield,
  Sun,
  Moon,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface CosmicSidebarProps {
  onLogout: () => void;
  user: UserProfile;
  isAdmin?: boolean;
}

const CosmicSidebar: React.FC<CosmicSidebarProps> = ({ onLogout, user, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutGrid, description: 'View your decks and progress' },
    { title: 'Study Plan', path: '/dashboard/planner', icon: Layers, description: 'Plan your study schedule' },
    { title: 'Aura Operator', path: '/chat', icon: Zap, description: 'AI study assistant' },
    { title: 'Insights', path: '/dashboard/insights', icon: Activity, description: 'View learning analytics' },
    { title: 'Professor', path: '/dashboard/professor', icon: GraduationCap, description: 'Professor dashboard' },
    { title: 'Generate', path: '/generate', icon: Compass, description: 'Create flashcards with AI' },
    { title: 'Settings', path: '/settings', icon: Settings, description: 'Manage your account' },
    { title: 'Docs', path: '/docs', icon: FileText, description: 'Help and documentation' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[200] w-12 h-12 architectural-panel border border-arch-border flex items-center justify-center text-arch-fg hover:bg-arch-fg/5 transition-all"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 architectural-panel border-r border-arch-border flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-arch-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-arch-fg flex items-center justify-center">
                  <BrainCircuit size={24} className="text-arch-bg" />
                </div>
                <div>
                  <span className="font-black tracking-[0.3em] text-[10px] block uppercase text-arch-fg">AURAMIND</span>
                  <span className="text-[8px] uppercase tracking-[0.4em] text-arch-muted">{isAdmin ? 'Staff Console' : 'Study OS'}</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-arch-fg hover:text-arch-muted transition-colors">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 border border-arch-border transition-all ${isActive ? 'bg-arch-fg text-arch-bg' : 'text-arch-fg hover:bg-arch-muted/5'}`}
                  >
                    <item.icon size={20} className={isActive ? 'text-inherit' : 'text-arch-muted'} />
                    <div className="text-left flex-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] block">{item.title}</span>
                      <span className="text-[8px] uppercase tracking-[0.3em] text-arch-muted block mt-1">{item.description}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-arch-border space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-4 p-4 border border-arch-border hover:bg-arch-muted/5 transition-all text-arch-fg"
              >
                {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                  {resolvedTheme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
                </span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 p-4 border border-arch-border hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all text-arch-muted"
              >
                <LogOut size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-screen hidden lg:flex w-20 xl:w-64 architectural-panel z-[100] border-r border-arch-border flex-col items-center xl:items-stretch group/sidebar transition-all duration-500 ease-in-out">
        {/* SCAN LINE EFFECT */}
        <div className="absolute inset-0 pointer-events-none arch-scan-line opacity-10" />

      <div className="p-8 flex items-center gap-6 border-b border-arch-border">
        <div className="w-10 h-10 bg-arch-fg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/')}>
          <BrainCircuit size={24} className="text-arch-bg" />
        </div>
        <div className="hidden xl:block opacity-100 transition-opacity">
          <span className="font-black tracking-[0.3em] text-[10px] block uppercase text-arch-fg">AURAMIND</span>
          <span className="text-[8px] uppercase tracking-[0.4em] text-arch-muted mt-1">{isAdmin ? 'Staff Console' : 'Study OS'}</span>
        </div>
      </div>

      <nav className="flex-1 mt-10 px-0 space-y-0">
        <div className="space-y-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-6 p-8 border-b border-arch-border transition-all group/nav ${isActive ? 'bg-arch-fg text-arch-bg' : 'text-arch-fg hover:bg-arch-muted/5'}`}
              >
                <item.icon size={20} className={isActive ? 'text-inherit' : 'text-arch-muted group-hover/nav:text-arch-fg'} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden xl:block whitespace-nowrap">
                  {item.title}
                </span>
                {isActive && (
                   <div className="ml-auto h-2 w-2 bg-arch-bg hidden xl:block animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="border-t border-arch-border">
            <button
              onClick={() => navigate('/admin/vault')}
              className={`w-full flex items-center gap-6 p-8 border-b border-arch-border transition-all group/nav ${location.pathname === '/admin/vault' ? 'bg-arch-fg text-arch-bg' : 'text-arch-fg hover:bg-arch-muted/5'}`}
            >
              <Crown size={20} className={location.pathname === '/admin/vault' ? 'text-inherit' : 'text-arch-muted'} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden xl:block whitespace-nowrap">
                Admin Suite
              </span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-black/ dark:border-white/ space-y-2">
        <div className="hidden xl:flex items-center gap-4 p-8 bg-arch-muted/5 border-t border-arch-border">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 grayscale object-cover border border-arch-border" />
          ) : (
            <div className="w-10 h-10 border border-arch-border flex items-center justify-center text-arch-fg">
              <Shield size={18} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted">{isAdmin ? 'Staff' : 'Member'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest truncate text-arch-fg">{user.name || 'ACTIVE USER'}</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-6 p-8 border-t border-arch-border hover:bg-arch-muted/5 transition-all text-arch-fg"
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden xl:block">
            {resolvedTheme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
          </span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-6 p-8 group/logout hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all text-arch-muted"
        >
          <LogOut size={20} className="group-hover/logout:text-slate-900 dark:text-white transition-all" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden xl:block">Log Out</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default CosmicSidebar;
