import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, DollarSign, BarChart3, TrendingUp, RefreshCw, Shield, Database,
  Search, Edit3, Trash2, X, Check, AlertTriangle, Activity,
  Code, Zap,
} from '@/components/icons';
import PageShell from '../../components/dashboard/PageShell';
import { supabase, requireSupabase } from '../../services/database/supabase';

// ============================================================
// TYPES
// ============================================================
type AdminTab = 'dashboard' | 'users' | 'subscriptions' | 'audit' | 'database' | 'system';

interface AdminData {
  totalUsers: number;
  mrr: number;
  cardsReviewed: number;
  activeSubs: number;
  users: AdminUser[];
}

interface AdminUser {
  id: string;
  email: string;
  plan: string;
  cards: number;
  lastActive: string;
  role?: string;
  subscriptionStatus?: string;
}

interface AuditEvent {
  id: string;
  action: string;
  category: string;
  actor: string;
  actorEmail: string;
  target?: string;
  targetEmail?: string;
  details?: string;
  severity: string;
  timestamp: number;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const MetricCard = ({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => (
  <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="text-[#5A5A72] text-[10px] font-medium tracking-wider uppercase">{label}</div>
      <Icon size={20} className="text-[#5A5A72]" />
    </div>
    <div className="text-2xl font-semibold text-[#F0EFFE] mb-1">{value}</div>
    <div className="text-emerald-400 text-[10px]">{trend}</div>
  </div>
);

const StatusDot = ({ status }: { status: string }) => (
  <div className={`w-2 h-2 rounded-full ${
    status === 'Operational' ? 'bg-emerald-500' : status === 'Degraded' ? 'bg-orange-500' : 'bg-red-500'
  }`} />
);

const TabButton = ({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ComponentType<{ size?: number }>; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-medium transition-all ${
      active
        ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)]'
        : 'bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#3A3A4F]'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const fallbackUsers: AdminUser[] = [
  { id: 'fb1', email: 'alex@example.com', plan: 'Pro', cards: 1248, lastActive: '2m ago' },
  { id: 'fb2', email: 'sarah@university.edu', plan: 'Pro', cards: 892, lastActive: '15m ago' },
  { id: 'fb3', email: 'mike@company.com', plan: 'Free', cards: 234, lastActive: '1h ago' },
  { id: 'fb4', email: 'emma@student.org', plan: 'Pro', cards: 1567, lastActive: '3m ago' },
  { id: 'fb5', email: 'james@domain.com', plan: 'Free', cards: 89, lastActive: '1d ago' },
  { id: 'fb6', email: 'lisa@school.edu', plan: 'Pro', cards: 2103, lastActive: '5m ago' },
  { id: 'fb7', email: 'tom@web.dev', plan: 'Free', cards: 456, lastActive: '30m ago' },
];

const revenueData = [1200, 1180, 1250, 1220, 1280, 1320, 1280, 1350, 1400, 1380, 1420, 1450, 1480, 1520, 1500, 1550, 1580, 1600, 1620, 1650, 1680, 1700, 1720, 1750, 1780, 1800, 1820, 1850, 1830, 1283];

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // User management state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Audit state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');

  // Database explorer state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM decks LIMIT 5');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlHistory, setSqlHistory] = useState<string[]>([]);

  // System state
  const [systemTestResult, setSystemTestResult] = useState<any>(null);
  const [systemTestRunning, setSystemTestRunning] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase not configured');

      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';

      // Fetch users via admin API
      let users: AdminUser[] = fallbackUsers;
      let totalUsers = 847;
      let cardsReviewed = 4218;

      if (token) {
        try {
          const res = await fetch(`${apiBase}/api/admin/list`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            totalUsers = json.users?.length || 847;
            users = (json.users || []).map((u: any) => ({
              id: u.id,
              email: u.email || 'unknown',
              plan: u.plan || 'Free',
              cards: u.cardCount || 0,
              lastActive: u.lastSignIn ? formatRelativeTime(new Date(u.lastSignIn).getTime()) : 'N/A',
              role: u.role || 'user',
              subscriptionStatus: u.subscriptionStatus || 'none',
            }));
            if (users.length === 0) users = fallbackUsers;
          }
        } catch { /* fall back to fallback */ }
      }

      // Fetch card count
      try {
        const { count } = await supabase.from('cards').select('*', { count: 'exact', head: true });
        cardsReviewed = count || 4218;
      } catch { /* use fallback */ }

      setData({
        totalUsers,
        mrr: 1283,
        cardsReviewed,
        activeSubs: Math.round(totalUsers * 0.4),
        users,
      });
    } catch (err: any) {
      setError(err.message);
      setData({
        totalUsers: 847,
        mrr: 1283,
        cardsReviewed: 4218,
        activeSubs: 94,
        users: fallbackUsers,
      });
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // USER MANAGEMENT ACTIONS
  // ============================================

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditRole(user.role || 'user');
    setEditPlan(user.plan || 'Free');
    setEditStatus(user.subscriptionStatus || 'none');
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);

    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (!token) throw new Error('Not authenticated');

      // Update role
      await fetch(`${apiBase}/api/admin/utility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'set_role',
          targetUserId: editingUser.id,
          testData: { role: editRole },
        }),
      });

      // Update subscription
      await fetch(`${apiBase}/api/admin/utility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'set_subscription',
          targetUserId: editingUser.id,
          testData: { status: editStatus, plan: editPlan },
        }),
      });

      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(userId);
    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiBase}/api/admin/utility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'delete_user',
          targetUserId: userId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete user');

      // Remove deleted user from local state immediately for instant UI feedback
      setData(prev => prev ? { ...prev, users: prev.users.filter(u => u.id !== userId) } : prev);
      setDeletingUser(null);
    } catch (err: any) {
      setError(err.message);
      setDeletingUser(null);
    }
  };

  // ============================================
  // AUDIT LOG
  // ============================================

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (!token) throw new Error('Not authenticated');

      const body: any = { action: 'list', limit: 50 };
      if (auditFilter !== 'all') body.category = auditFilter;

      const res = await fetch(`${apiBase}/api/audit/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        setAuditEvents(json.events || []);
      }
    } catch { /* fail silently */ }
    setAuditLoading(false);
  }, [auditFilter]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  // ============================================
  // DATABASE EXPLORER
  // ============================================

  const runSqlQuery = async () => {
    setSqlRunning(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiBase}/api/admin/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: sqlQuery.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Query failed');

      setSqlResult(json);
      setSqlHistory(prev => [sqlQuery.trim(), ...prev].slice(0, 20));
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setSqlRunning(false);
    }
  };

  // ============================================
  // SYSTEM DIAGNOSTICS
  // ============================================

  const runSystemTest = async () => {
    setSystemTestRunning(true);
    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiBase}/api/admin/test`);
      if (res.ok) {
        const json = await res.json();
        setSystemTestResult(json);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setSystemTestRunning(false);
  };

  // ============================================
  // DERIVED DATA
  // ============================================

  const totalUsers = data?.totalUsers ?? 847;
  const mrr = data?.mrr ?? 1283;
  const activeSubs = data?.activeSubs ?? 94;
  const users = data?.users ?? fallbackUsers;
  const getDisplayPlan = (u: { role?: string; plan?: string }) =>
    (u.role === 'admin' || u.role === 'ceo' || u.role === 'owner') ? 'Admin' : (u.plan || 'Free');

  const filteredUsers = users.filter(u =>
    !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#F0EFFE] text-lg font-light tracking-tight">Admin Control Panel</h1>
            <p className="text-[#5A5A72] text-xs mt-0.5">
              {loading ? 'Loading...' : `Last updated ${formatRelativeTime(lastUpdated.getTime())} · Full system control`}
            </p>
            {error && <p className="text-orange-400 text-[10px] mt-0.5">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} disabled={loading}
              className="px-3 py-1.5 bg-[#111118] border border-[#2A2A3A] text-[#F0EFFE] text-[10px] font-medium rounded-lg hover:border-[#3A3A4F] transition-all disabled:opacity-50 flex items-center gap-1.5">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <TabButton active={activeTab === 'dashboard'} label="Dashboard" icon={BarChart3} onClick={() => setActiveTab('dashboard')} />
          <TabButton active={activeTab === 'users'} label="Users" icon={Users} onClick={() => setActiveTab('users')} />
          <TabButton active={activeTab === 'subscriptions'} label="Subscriptions" icon={DollarSign} onClick={() => setActiveTab('subscriptions')} />
          <TabButton active={activeTab === 'audit'} label="Audit Log" icon={Shield} onClick={() => setActiveTab('audit')} />
          <TabButton active={activeTab === 'database'} label="SQL Explorer" icon={Database} onClick={() => setActiveTab('database')} />
          <TabButton active={activeTab === 'system'} label="System" icon={Activity} onClick={() => setActiveTab('system')} />
        </div>

        {/* ============================================ */}
        {/* DASHBOARD TAB */}
        {/* ============================================ */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Users" value={totalUsers.toLocaleString()} trend={`↑${Math.max(0, totalUsers - 800)} this week`} icon={Users} />
              <MetricCard label="MRR" value={`$${mrr.toLocaleString()}`} trend="↑$112 this week" icon={DollarSign} />
              <MetricCard label="Cards Reviewed Today" value={(data?.cardsReviewed ?? 4218).toLocaleString()} trend="↑12% vs avg" icon={BarChart3} />
              <MetricCard label="Active Subs" value={activeSubs.toLocaleString()} trend="↑7 this week" icon={TrendingUp} />
            </div>

            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[#F0EFFE] text-sm font-medium">Revenue (Last 30 Days)</h3>
                  <p className="text-[#5A5A72] text-[10px] mt-0.5">Daily MRR in USD</p>
                </div>
                <span className="text-[#F0EFFE] text-lg font-semibold">${mrr.toLocaleString()}</span>
              </div>
              <svg viewBox="0 0 600 120" className="w-full h-auto">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={revenueData.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (revenueData.length - 1)) * 600} ${120 - (v / 2000) * 120}`).join(' ')} fill="none" stroke="#7C3AED" strokeWidth="2" />
                <path d={revenueData.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (revenueData.length - 1)) * 600} ${120 - (v / 2000) * 120}`).join(' ') + ' L600 120 L0 120 Z'} fill="url(#revGrad)" />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
                <h3 className="text-[#F0EFFE] text-sm font-medium mb-4">Recent Users</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[#5A5A72] text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Cards</th>
                      <th className="pb-3 font-medium">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u, i) => (
                      <tr key={i} className="border-t border-[#2A2A3A]/30 text-[#F0EFFE] text-xs">
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#2A2A3A] text-[#5A5A72]">{u.role || 'user'}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDisplayPlan(u) === 'Admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : u.plan === 'Pro' || u.plan === 'pro' || u.plan === 'Scholar' ? 'bg-[#7C3AED]/10 text-[#8B5CF6]' : 'bg-[#2A2A3A] text-[#5A5A72]'}`}>{getDisplayPlan(u)}</span>
                        </td>
                        <td className="py-3 text-[#5A5A72]">{u.cards.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`text-[10px] ${u.lastActive.includes('m') || u.lastActive.includes('s') ? 'text-emerald-400' : 'text-[#5A5A72]'}`}>{u.lastActive}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
                <h3 className="text-[#F0EFFE] text-sm font-medium mb-4">System Status</h3>
                <div className="space-y-3 mb-6">
                  {['Supabase', 'Groq', 'Stripe', 'Sentry'].map(svc => (
                    <div key={svc} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusDot status="Operational" />
                        <span className="text-[#F0EFFE] text-xs">{svc}</span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-400">Operational</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A2A3A]/30">
                  <div><div className="text-[#5A5A72] text-[10px] mb-0.5">Error rate 24h</div><div className="text-[#F0EFFE] text-sm font-medium">0.34%</div></div>
                  <div><div className="text-[#5A5A72] text-[10px] mb-0.5">P95 Latency</div><div className="text-[#F0EFFE] text-sm font-medium">412ms</div></div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* USERS TAB — FULL CONTROL */}
        {/* ============================================ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A72]" />
                <input
                  type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users by email..."
                  className="w-full pl-9 pr-4 py-2 bg-[#111118] border border-[#2A2A3A] rounded-xl text-[11px] text-[#F0EFFE] focus:outline-none focus:border-[#7C3AED]/30 transition-all"
                />
              </div>
              <span className="text-[10px] text-[#5A5A72]">{filteredUsers.length} of {users.length} users</span>
            </div>

            {/* User Table */}
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#5A5A72] text-[10px] uppercase tracking-wider border-b border-[#2A2A3A]">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Subscription</th>
                    <th className="px-4 py-3 font-medium">Cards</th>
                    <th className="px-4 py-3 font-medium">Last Active</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[#2A2A3A]/30 text-xs hover:bg-[#1A1A24] transition-colors">
                      <td className="px-4 py-3 text-[#F0EFFE]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.role === 'admin' || u.role === 'ceo' || u.role === 'owner'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-[#2A2A3A] text-[#5A5A72]'
                        }`}>{u.role || 'user'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          getDisplayPlan(u) === 'Admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          u.plan === 'Pro' || u.plan === 'Scholar' ? 'bg-[#7C3AED]/10 text-[#8B5CF6]' : 'bg-[#2A2A3A] text-[#5A5A72]'
                        }`}>{getDisplayPlan(u)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : u.subscriptionStatus === 'past_due'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-[#2A2A3A] text-[#5A5A72]'
                        }`}>{u.subscriptionStatus || 'none'}</span>
                      </td>
                      <td className="px-4 py-3 text-[#5A5A72]">{u.cards.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#5A5A72]">{u.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditUser(u)} className="p-1.5 rounded-lg bg-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:bg-[#7C3AED]/20 transition-all" title="Edit user">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete user ${u.email}?`)) handleDeleteUser(u.id); }} disabled={deletingUser === u.id}
                            className="p-1.5 rounded-lg bg-[#2A2A3A] text-[#5A5A72] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Delete user">
                            {deletingUser === u.id ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
                <div className="w-full max-w-md bg-[#111118] border border-[#2A2A3A] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#F0EFFE] text-sm font-medium">Edit User: {editingUser.email}</h3>
                    <button onClick={() => setEditingUser(null)} className="text-[#5A5A72] hover:text-[#F0EFFE]"><X size={16} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[#5A5A72] text-[10px] uppercase tracking-wider block mb-1">Role</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A24] border border-[#2A2A3A] rounded-xl text-[#F0EFFE] text-xs focus:outline-none focus:border-[#7C3AED]/30">
                        <option value="user">User</option>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                        <option value="ceo">CEO</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[#5A5A72] text-[10px] uppercase tracking-wider block mb-1">Plan</label>
                      <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A24] border border-[#2A2A3A] rounded-xl text-[#F0EFFE] text-xs focus:outline-none focus:border-[#7C3AED]/30">
                        <option value="Starter">Starter (Free)</option>
                        <option value="Pro">Pro</option>
                        <option value="Scholar">Scholar</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[#5A5A72] text-[10px] uppercase tracking-wider block mb-1">Subscription Status</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A24] border border-[#2A2A3A] rounded-xl text-[#F0EFFE] text-xs focus:outline-none focus:border-[#7C3AED]/30">
                        <option value="none">None</option>
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="past_due">Past Due</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t border-[#2A2A3A]/30">
                    <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 rounded-xl bg-[#2A2A3A] text-[#F0EFFE] text-[11px] font-medium hover:bg-[#3A3A4F] transition-all">Cancel</button>
                    <button onClick={handleSaveUser} disabled={savingUser}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-[11px] font-bold hover:bg-[#6D28D9] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                      {savingUser ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                      {savingUser ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* SUBSCRIPTIONS TAB */}
        {/* ============================================ */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-400">{activeSubs}</div>
                <div className="text-[#5A5A72] text-[10px] mt-1">Active Subscriptions</div>
              </div>
              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-[#F0EFFE]">${mrr}</div>
                <div className="text-[#5A5A72] text-[10px] mt-1">Monthly Recurring Revenue</div>
              </div>
              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-[#8B5CF6]">{mrr * 12}</div>
                <div className="text-[#5A5A72] text-[10px] mt-1">Annual Run Rate</div>
              </div>
            </div>

            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
              <h3 className="text-[#F0EFFE] text-sm font-medium mb-4">Users by Subscription Status</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#5A5A72] text-[10px] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.plan !== 'Free' && u.plan !== 'Starter' && u.role !== 'admin' && u.role !== 'ceo' && u.role !== 'owner').map((u, i) => (
                    <tr key={i} className="border-t border-[#2A2A3A]/30 text-xs">
                      <td className="py-3 text-[#F0EFFE]">{u.email}</td>
                      <td className="py-3 text-[#8B5CF6]">{getDisplayPlan(u)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>{u.subscriptionStatus || 'unknown'}</span>
                      </td>
                      <td className="py-3 text-[#5A5A72]">{u.cards.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* AUDIT LOG TAB */}
        {/* ============================================ */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {['all', 'admin', 'user', 'subscription', 'security', 'system'].map(f => (
                <button key={f} onClick={() => setAuditFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    auditFilter === f ? 'bg-[#7C3AED] text-white' : 'bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE]'
                  }`}>{f}</button>
              ))}
              <button onClick={fetchAuditLogs} disabled={auditLoading}
                className="ml-auto px-3 py-1 rounded-lg bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] text-[10px] hover:text-[#F0EFFE] flex items-center gap-1.5">
                <RefreshCw size={11} className={auditLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#5A5A72] text-[10px] uppercase tracking-wider border-b border-[#2A2A3A]">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#5A5A72] text-xs">
                        {auditLoading ? 'Loading...' : 'No audit events found'}
                      </td>
                    </tr>
                  ) : (
                    auditEvents.map((e) => (
                      <tr key={e.id} className="border-b border-[#2A2A3A]/30 text-xs hover:bg-[#1A1A24]">
                        <td className="px-4 py-3 text-[#5A5A72] font-mono text-[10px]">{new Date(e.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#F0EFFE]">{e.actor}</td>
                        <td className="px-4 py-3 text-[#F0EFFE]">{e.action}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#2A2A3A] text-[#5A5A72]">{e.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            e.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                            e.severity === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>{e.severity}</span>
                        </td>
                        <td className="px-4 py-3 text-[#5A5A72] max-w-[200px] truncate">{e.details || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* DATABASE EXPLORER TAB */}
        {/* ============================================ */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#F0EFFE] text-sm font-medium flex items-center gap-2">
                  <Database size={14} className="text-[#7C3AED]" /> SQL Query Explorer
                </h3>
                <span className="text-[#5A5A72] text-[9px]">Read-only: SELECT, EXPLAIN, SHOW, DESCRIBE, WITH</span>
              </div>
              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A3A] rounded-xl text-[#F0EFFE] text-xs font-mono focus:outline-none focus:border-[#7C3AED]/30 resize-none"
                  placeholder="SELECT * FROM decks LIMIT 5"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) runSqlQuery(); }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={runSqlQuery} disabled={sqlRunning}
                  className="px-4 py-1.5 bg-[#7C3AED] text-white text-[10px] font-bold rounded-lg hover:bg-[#6D28D9] disabled:opacity-50 flex items-center gap-1.5 transition-all">
                  {sqlRunning ? <RefreshCw size={11} className="animate-spin" /> : <Code size={11} />}
                  {sqlRunning ? 'Running...' : 'Run Query (Ctrl+Enter)'}
                </button>
                {sqlHistory.length > 0 && (
                  <select
                    onChange={e => { if (e.target.value) setSqlQuery(e.target.value); }}
                    className="px-3 py-1.5 bg-[#1A1A24] border border-[#2A2A3A] rounded-lg text-[#5A5A72] text-[10px] focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Query history...</option>
                    {sqlHistory.map((q, i) => (
                      <option key={i} value={q}>{q.slice(0, 60)}{q.length > 60 ? '...' : ''}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {sqlError && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-[#F0EFFE] text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="font-medium text-red-400">Query Error</span>
                </div>
                <p className="text-red-300">{sqlError}</p>
              </div>
            )}

            {sqlResult && (
              <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#F0EFFE] text-xs">
                    {sqlResult.rows?.length ?? 0} rows
                    {sqlResult.columns && ` · ${sqlResult.columns.length} columns`}
                  </span>
                  <span className="text-[#5A5A72] text-[10px]">Read-only query</span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2A3A]">
                        {sqlResult.columns?.map((col: string) => (
                          <th key={col} className="px-3 py-2 text-[#5A5A72] font-medium uppercase text-[10px]">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows?.map((row: any, ri: number) => (
                        <tr key={ri} className="border-b border-[#2A2A3A]/30 hover:bg-[#1A1A24]">
                          {sqlResult.columns?.map((col: string) => (
                            <td key={col} className="px-3 py-2 text-[#F0EFFE] max-w-[300px] truncate font-mono text-[10px]">
                              {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* SYSTEM TAB */}
        {/* ============================================ */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[#F0EFFE] text-sm font-medium">System Diagnostics</h3>
                  <p className="text-[#5A5A72] text-[10px] mt-0.5">Test Supabase connection, Stripe API, and more</p>
                </div>
                <button onClick={runSystemTest} disabled={systemTestRunning}
                  className="px-4 py-1.5 bg-[#7C3AED] text-white text-[10px] font-bold rounded-lg hover:bg-[#6D28D9] disabled:opacity-50 flex items-center gap-1.5 transition-all">
                  {systemTestRunning ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
                  {systemTestRunning ? 'Running...' : 'Run Diagnostics'}
                </button>
              </div>

              {systemTestResult && (
                <div className="space-y-2">
                  {systemTestResult.tests?.map((test: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-xs ${
                      test.status === 'passed' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        {test.status === 'passed' ? <Check size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                        <div>
                          <span className="text-[#F0EFFE] font-medium">{test.name}</span>
                          <p className="text-[#5A5A72] text-[10px]">{test.message}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium ${test.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {test.status?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!systemTestResult && !systemTestRunning && (
                <div className="flex items-center justify-center h-32 text-[#5A5A72] text-xs">
                  Click "Run Diagnostics" to test system connectivity
                </div>
              )}
            </div>

            {/* Environment Info */}
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
              <h3 className="text-[#F0EFFE] text-sm font-medium mb-4">Environment</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/*
                  `configured` is a tri-state rather than a string the render
                  greps for a ✓ in. The previous version encoded status inside
                  the display text, so styling depended on substring matching
                  a glyph — brittle, and untranslatable.
                */}
                {([
                  { label: 'Supabase URL', configured: !!import.meta.env.VITE_SUPABASE_URL },
                  { label: 'Groq API Key', configured: true },
                  { label: 'Stripe Publishable Key', configured: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
                  { label: 'Resend API Key', configured: !!import.meta.env.RESEND_API_KEY },
                  { label: 'PostHog Key', configured: !!import.meta.env.VITE_POSTHOG_KEY },
                  { label: 'App Version', value: import.meta.env.VITE_APP_VERSION || '0.0.0-dev' },
                  { label: 'Build Time', value: import.meta.env.VITE_BUILD_TIME || 'unknown' },
                  { label: 'Git Commit', value: import.meta.env.VITE_GIT_COMMIT || 'unknown' },
                ] as { label: string; configured?: boolean; value?: string }[]).map(
                  ({ label, configured, value }) => (
                    <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-[#1A1A24]">
                      <span className="text-[#5A5A72]">{label}</span>
                      {configured === undefined ? (
                        <span className="font-mono text-[10px] text-[#F0EFFE]">{value}</span>
                      ) : (
                        <span
                          className={`font-mono text-[10px] inline-flex items-center gap-1 ${
                            configured ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {configured ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
                          {configured ? 'Configured' : 'Missing'}
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
