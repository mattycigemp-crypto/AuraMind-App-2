import React, { useEffect, useState } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import {
  CreditCardIcon as CreditCard,
  UsersIcon as Users,
  TrendingUpIcon as TrendingUp,
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
};

const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ className }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { supabase } = await import('../../services/database/supabase');
        const session = await supabase?.auth.getSession();
        const token = session?.data.session?.access_token;
        if (!token) return;
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
    };
    fetchData();
  }, []);

  const totalUsers = users.length;
  const activeSubs = users.filter((u) => u.plan !== 'Starter').length;
  const conversionRate = totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 100) : 0;

  const planDistribution: PlanCount[] = Object.entries(
    users.reduce<Record<string, number>>((acc, u) => {
      acc[u.plan] = (acc[u.plan] || 0) + 1;
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
    <div className={cn("space-y-10", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={totalUsers.toLocaleString()} subtitle="All accounts" icon={Users} />
        <StatCard title="Active Subs" value={activeSubs} subtitle="Paid plan users" icon={CreditCard} variant="cosmic" />
        <StatCard title="Free→Paid Conv." value={`${conversionRate}%`} subtitle="Conversion rate" icon={TrendingUp} />
      </div>

      <div className="architectural-panel p-8 rounded-[32px] border-primary/10 bg-primary/[0.01]">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-8">Plan Distribution</h3>
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
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
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

      <div className="bg-zinc-900/30 border border-primary/10 rounded-[32px] p-8">
        <p className="text-xs text-zinc-500 italic leading-relaxed">
          Revenue metrics (MRR, ARPU, churn) require Stripe data integration and will be shown here once the billing analytics endpoint is connected.
        </p>
      </div>
    </div>
  );
};

export default AdminSubscriptions;



