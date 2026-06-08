import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboardIcon as LayoutDashboard,
  UsersIcon as Users,
  CreditCardIcon as CreditCard,
  ActivityIcon as Activity,
  FileTextIcon as FileText,
  ShieldIcon as Shield,
} from '../../components/icons/CustomIcons';

export type AdminSection = 'overview' | 'users' | 'subscriptions' | 'analytics' | 'content' | 'audit';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  className?: string;
}

const sections: { id: AdminSection; label: string; icon: React.FC<{ className?: string; size?: number; fill?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'analytics', label: 'Platform Analytics', icon: Activity },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'audit', label: 'Audit Log', icon: Shield },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange, className }) => {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4 px-3">
        Admin Console
      </p>
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export { AdminSidebar };



