import React, { useEffect, useState, useCallback } from 'react';
import PageShell from '../../components/dashboard/PageShell';
import {
  CreditCardIcon as CreditCard,
  UsersIcon as Users,
  TrendingUpIcon as TrendingUp,
  RefreshCwIcon as RefreshCw,
} from '../../components/icons/CustomIcons';
import { cn } from '../../lib/utils';

interface AdminSubscriptionsProps {
  className?: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  role: string;
  plan: string;
  lastSignIn: string | null;
  created: string;
}

interface PlanCount {
  plan: string;
  count: number;
  pct: number;
  color: string;
}

const PLAN_COLORS: Record<string, string> = {
  Starter: '#3f3f46',
  Pro: '#8B5CF6',
  Scholar: '#22c55e',
  Admin: '#10B981',
};

const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ className }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../services/database/supabase');
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.users) {
          setUsers(json.data.users);
        }
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalUsers = users.length;
  const activeSubs = users.filter((u) => u.plan !== 'Starter' && u.role !== 'admin' && u.role !== 'ceo' && u.role !== 'owner').length;
  const conversionRate = totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 100) : 0;

  const planDistribution: PlanCount[] = Object.entries(
    users.reduce<Record<string, number>>((acc, u) => {
      const plan = (u.role === 'admin' || u.role === 'ceo' || u.role === 'owner') ? 'Admin' : u.plan;
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([plan, count]) => ({
      plan,
      count,
      pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      color: PLAN_COLORS[plan] || '#71717a',
    }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell>
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            <CreditCard size={12} className="text-primary" />
            Subscription Hub
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">Revenue metrics, plan distribution, and billing insights</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all">
          <RefreshCw size={11} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatPill label="Total Users" value={totalUsers.toLocaleString()} subtitle="All accounts" icon={Users} />
        <StatPill label="Active Subs" value={activeSubs} subtitle="Paid plan users" icon={CreditCard} accent="primary" />
        <StatPill label="Free→Paid Conv." value={`${conversionRate}%`} subtitle="Conversion rate" icon={TrendingUp} />
      </div>

      <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
        <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] mb-6">Plan Distribution</h3>
        {planDistribution.length > 0 ? (
          <div className="space-y-6">
            {planDistribution.map((plan) => (
              <div key={plan.plan} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="text-xs text-zinc-300">{plan.plan}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">{plan.count} ({plan.pct}%)</span>
                </div>
                <div className="h-2 bg-zinc-800/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${plan.pct}%`, backgroundColor: plan.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 italic text-sm py-8 text-center">No user data available</p>
        )}
      </div>

      <div className="p-4 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
        <p className="text-[11px] text-zinc-500 italic leading-relaxed">
          Revenue metrics (MRR, ARPU, churn) require Stripe data integration and will be shown here once the billing analytics endpoint is connected.
        </p>
      </div>
    </div>
    </PageShell>
  );
};

export default AdminSubscriptions;

// --- Stat Pill ---
const StatPill: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className={cn(
    'flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm transition-all',
    accent === 'primary'
      ? 'bg-primary/[0.04] border-primary/20'
      : 'bg-zinc-900/10 border-zinc-700/30'
  )}>
    <Icon size={16} className={accent === 'primary' ? 'text-primary' : 'text-zinc-500'} />
    <div>
      <p className="text-base font-black text-white leading-none">{value}</p>
      <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">{label}</p>
    </div>
  </div>
);



