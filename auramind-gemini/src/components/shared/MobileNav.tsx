import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGridIcon as LayoutGrid, 
  LayersIcon as Layers, 
  ZapIcon as Zap, 
  SettingsIcon as Settings, 
  PlusIcon as Plus,
  GraduationCapIcon as GraduationCap
} from '../icons/CustomIcons';

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { title: 'Study Plan', path: '/dashboard/planner', icon: Layers },
    { title: 'Operator', path: '/chat', icon: Zap },
    { title: 'Professor', path: '/dashboard/professor', icon: GraduationCap },
    { title: 'Generate', path: '/generate', icon: Plus },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/5 dark:bg-white/ dark:bg-black/80 backdrop-blur-xl border-t border-arch-border z-[100] flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${isActive ? 'text-black dark:text-white' : 'text-arch-muted'}`}
          >
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.title}</span>
            {isActive && (
              <div className="w-1 h-1 bg-black dark:bg-white rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MobileNav;



