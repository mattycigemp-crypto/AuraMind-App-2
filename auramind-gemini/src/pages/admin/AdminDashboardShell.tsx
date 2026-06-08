import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { AdminSidebar, type AdminSection } from './AdminSidebar';
import { PageHeader } from '../../components/dashboard/UnifiedDashboard';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminAnalytics from './AdminAnalytics';
import AdminContent from './AdminContent';

interface AdminDashboardShellProps {
  className?: string;
}

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  overview: { title: 'System Overview', description: 'Root-level telemetry and platform health metrics' },
  users: { title: 'User Management', description: 'Identity registry, role assignment, and account oversight' },
  subscriptions: { title: 'Subscription Hub', description: 'Revenue metrics, plan distribution, and billing insights' },
  analytics: { title: 'Platform Analytics', description: 'Cross-user adoption metrics and retention intelligence' },
  content: { title: 'Content Library', description: 'Knowledge base statistics and content source breakdown' },
  audit: { title: 'Audit Log', description: 'System activity trail and administrative actions' },
};

const AuditLogPlaceholder: React.FC = () => (
  <div className="flex items-center justify-center h-64 text-zinc-600 italic text-sm">
    Audit log coming soon
  </div>
);

const sectionComponents: Record<AdminSection, React.FC<{ className?: string }>> = {
  overview: AdminOverview,
  users: AdminUsers,
  subscriptions: AdminSubscriptions,
  analytics: AdminAnalytics,
  content: AdminContent,
  audit: AuditLogPlaceholder,
};

const AdminDashboardShell: React.FC<AdminDashboardShellProps> = ({ className }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const SectionComponent = sectionComponents[activeSection];
  const meta = sectionMeta[activeSection];

  return (
    <div className={cn("flex gap-10", className)}>
      {/* Admin Sidebar Sub-nav */}
      <div className="w-56 shrink-0 hidden lg:block">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Mobile section tabs */}
      <div className="lg:hidden overflow-x-auto mb-6">
        <div className="flex gap-2 pb-2">
          {(Object.entries(sectionMeta) as [AdminSection, typeof meta][]).map(([id, m]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
                activeSection === id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-zinc-900/40 text-zinc-500 border border-transparent hover:text-zinc-300'
              )}
            >
              {m.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <PageHeader title={meta.title} description={meta.description} />
        <SectionComponent />
      </div>
    </div>
  );
};

export default AdminDashboardShell;



