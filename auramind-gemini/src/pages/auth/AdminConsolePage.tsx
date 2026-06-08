import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/database/supabase';
import { UserRole, UserProfile } from '../../types';
import { ROLE_HIERARCHY, ROLE_LABELS, ROLE_DESCRIPTIONS, canManageRole, getPermissions } from '../../utils/permissions';
import {
  UsersIcon as Users, ShieldIcon as Shield, ActivityIcon as Activity, SearchIcon as Search, XIcon as X, ChevronDownIcon as ChevronDown,
  MailIcon as Mail, CalendarIcon as Calendar, ClockIcon as Clock, ZapIcon as Zap, AlertTriangleIcon as AlertTriangle, CheckCircle2Icon as CheckCircle2,
  PlusIcon as Plus, RefreshCwIcon as RefreshCw, Trash2Icon as Trash2, EyeIcon as Eye, UserPlusIcon as UserPlus, BanIcon as Ban,
  Loader2Icon as Loader2, MoreVerticalIcon as MoreVertical
} from '../../components/icons/CustomIcons';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdmin: boolean;
  plan: string;
  avatar?: string;
  lastSignIn?: string;
  created?: string;
  subscriptionStatus?: string;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  totalCards: number;
  totalDecks: number;
}

const ROLES = [UserRole.OWNER, UserRole.CEO, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.USER];
const SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due', 'canceled', 'none'];

async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function adminApiCall(action: string, body?: Record<string, any>): Promise<any> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const url = `/api/admin/${action}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}

async function adminUtilityCall(utilityAction: string, data: Record<string, any>): Promise<any> {
  return adminApiCall('utility', { action: utilityAction, ...data });
}

async function fetchUsersFromAuth(): Promise<AdminUser[]> {
  const result = await adminApiCall('list');
  return (result.users || []).map((u: any) => ({
    ...u,
    role: u.role || UserRole.USER,
    subscriptionStatus: u.subscription_status || 'none',
  }));
}

const AdminConsolePage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({ activeUsers: 0, totalUsers: 0, totalCards: 0, totalDecks: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.USER);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create test user form
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: UserRole.USER });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedUsers, metricsResult] = await Promise.all([
        fetchUsersFromAuth(),
        adminApiCall('test').catch(() => ({
          tests: [],
          timestamp: new Date().toISOString(),
        })),
      ]);

      setUsers(fetchedUsers);
      setMetrics({
        activeUsers: fetchedUsers.filter(u => u.lastSignIn).length,
        totalUsers: fetchedUsers.length,
        totalCards: 0,
        totalDecks: 0,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role) {
        setCurrentUserRole(user.user_metadata.role as UserRole);
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Admin API not available locally. Run `vercel dev` in the project root to start the API server alongside the frontend, or deploy to Vercel.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    if (!canManageRole(currentUserRole, targetUser.role)) {
      setError(`You cannot change the role of ${targetUser.role} users`);
      return;
    }
    if (!canManageRole(currentUserRole, newRole)) {
      setError(`You cannot assign the ${newRole} role`);
      return;
    }

    setActionLoading(userId);
    try {
      await adminUtilityCall('set_role', { targetUserId: userId, testData: { role: newRole } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, isAdmin: newRole !== UserRole.USER } : u));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscriptionChange = async (userId: string, status: string, plan?: string) => {
    setActionLoading(`sub-${userId}`);
    try {
      await adminUtilityCall('set_subscription', {
        targetUserId: userId,
        testData: { status, plan: plan || 'Pro' },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: status, plan: plan || u.plan } : u));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) return;
    setActionLoading('create');
    try {
      await adminUtilityCall('create_test_user', {
        testData: {
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          makeAdmin: createForm.role !== UserRole.USER,
        },
      });
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', role: UserRole.USER });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statsCards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Admins', value: users.filter(u => u.isAdmin).length, icon: Shield, color: 'text-purple-400' },
    { label: 'Active', value: metrics.activeUsers, icon: Activity, color: 'text-green-400' },
    { label: 'With Cards', value: metrics.totalCards > 0 ? 'Yes' : 'N/A', icon: Zap, color: 'text-yellow-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="h-7 w-7 text-primary" />
              Admin Console
            </h1>
            <p className="text-zinc-400 text-sm mt-1">User management & system controls</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 font-medium transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, i) => (
            <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
              className="appearance-none px-4 py-2.5 pr-10 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* User table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Subscription</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Sign In</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                      {search || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-100">{user.name || 'Unknown'}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={!canManageRole(currentUserRole, user.role) || actionLoading === user.id}
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-sm border text-zinc-100 focus:outline-none focus:border-primary/50 ${
                              user.role === UserRole.OWNER ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                              user.role === UserRole.CEO ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
                              user.role === UserRole.ADMIN ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                              user.role === UserRole.EMPLOYEE ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                              'bg-zinc-800/50 border-zinc-700/30 text-zinc-300'
                            } ${!canManageRole(currentUserRole, user.role) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {ROLES.filter(r => canManageRole(currentUserRole, r)).map(role => (
                              <option key={role} value={role} className="bg-zinc-900 text-zinc-100">
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                            {!ROLES.filter(r => canManageRole(currentUserRole, r)).find(r => r === user.role) && (
                              <option value={user.role} className="bg-zinc-900 text-zinc-100">
                                {ROLE_LABELS[user.role]} (current)
                              </option>
                            )}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                          {actionLoading === user.id && (
                            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3 w-3 text-primary animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.plan === 'Pro' ? 'bg-primary/10 text-primary' :
                          user.plan === 'Scholar' ? 'bg-purple-500/10 text-purple-300' :
                          'bg-zinc-800/50 text-zinc-400'
                        }`}>
                          {user.plan || 'Starter'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={user.subscriptionStatus || 'none'}
                            onChange={e => handleSubscriptionChange(user.id, e.target.value)}
                            disabled={actionLoading === `sub-${user.id}`}
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs border focus:outline-none focus:border-primary/50 cursor-pointer ${
                              user.subscriptionStatus === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                              user.subscriptionStatus === 'trialing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
                              user.subscriptionStatus === 'past_due' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                              user.subscriptionStatus === 'canceled' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                              'bg-zinc-800/50 border-zinc-700/30 text-zinc-400'
                            }`}
                          >
                            {SUBSCRIPTION_STATUSES.map(s => (
                              <option key={s} value={s} className="bg-zinc-900 text-zinc-100">{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                          {actionLoading === `sub-${user.id}` && (
                            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3 w-3 text-primary animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {user.created ? new Date(user.created).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {user.lastSignIn ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(user.lastSignIn).toLocaleDateString()}
                          </span>
                        ) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                          className={`p-2 rounded-lg transition-colors ${
                            selectedUser?.id === user.id ? 'bg-primary/20 text-primary' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User detail panel */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedUser.name}</h2>
                  <p className="text-sm text-zinc-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Role</p>
                <p className="text-sm font-medium text-white">{ROLE_LABELS[selectedUser.role]}</p>
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Plan</p>
                <p className="text-sm font-medium text-white">{selectedUser.plan || 'Starter'}</p>
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Subscription</p>
                <p className={`text-sm font-medium ${
                  selectedUser.subscriptionStatus === 'active' ? 'text-green-400' :
                  selectedUser.subscriptionStatus === 'trialing' ? 'text-blue-400' :
                  'text-zinc-400'
                }`}>
                  {selectedUser.subscriptionStatus || 'none'}
                </p>
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Joined</p>
                <p className="text-sm font-medium text-white">
                  {selectedUser.created ? new Date(selectedUser.created).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                selectedUser.isAdmin ? 'bg-green-500/10 text-green-300' : 'bg-zinc-800/50 text-zinc-400'
              }`}>
                <CheckCircle2 className="h-3 w-3" />
                {selectedUser.isAdmin ? 'Admin' : 'Standard User'}
              </span>
              {selectedUser.lastSignIn && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300">
                  <Calendar className="h-3 w-3" />
                  Last active: {new Date(selectedUser.lastSignIn).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Create user modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Create Test User
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Role</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-primary/50"
                  >
                    {ROLES.filter(r => canManageRole(currentUserRole, r) && r !== UserRole.OWNER).map(role => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={!createForm.email || !createForm.password || actionLoading === 'create'}
                  className="flex-1 px-4 py-2.5 bg-primary text-black rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'create' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsolePage;



