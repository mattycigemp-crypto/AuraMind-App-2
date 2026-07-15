import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../../components/dashboard/PageShell';
import { cn } from '../../lib/utils';
import {
  SearchIcon as Search,
  ShieldIcon as Shield,
  EyeIcon as Eye,
  XCircleIcon as XCircle,
  UsersIcon as Users,
  RefreshCwIcon as RefreshCw,
} from '../../components/icons/CustomIcons';

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

interface AdminUsersProps {
  className?: string;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ className }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setDetailDrawerOpen(true);
  };

  const toggleAdmin = async (targetUserId: string, makeAdmin: boolean) => {
    try {
      const { supabase } = await import('../../services/database/supabase');
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId, makeAdmin }),
      });
      await fetchUsers();
    } catch {}
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell>
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            <Users size={12} className="text-primary" />
            User Registry
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">Identity management, roles, and account oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all">
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-zinc-900/10 border border-zinc-700/30 rounded-xl text-[11px] text-zinc-300 focus:outline-none focus:border-primary/40 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-700/30">
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">User</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Role</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Plan</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3 pr-4">Last Sign In</th>
              <th className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-zinc-600 italic text-sm">No users found</td>
              </tr>
            ) : (
              filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-zinc-700/20 hover:bg-zinc-900/10 transition-colors group"
              >
                  <td className="py-3 pr-4">
                    <div>
                      <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                        {user.name}
                      </p>
                      <p className="text-[9px] text-zinc-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg',
                      user.isAdmin || user.role === 'owner'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-zinc-900/40 text-zinc-400 border border-zinc-700/30'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'text-[10px] font-bold',
                      user.role === 'admin' || user.role === 'ceo' || user.role === 'owner'
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    )}>
                      {user.role === 'admin' || user.role === 'ceo' || user.role === 'owner' ? 'Admin' : user.plan}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] text-zinc-500">
                      {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(user)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-primary hover:bg-primary/10 transition-all"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      {user.role !== 'owner' && (
                        <button
                          onClick={() => toggleAdmin(user.id, !user.isAdmin)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-primary hover:bg-primary/10 transition-all"
                          title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                        >
                          <Shield size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
      {detailDrawerOpen && selectedUser && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
            onClick={() => setDetailDrawerOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-zinc-950 border-l border-zinc-700/30 z-50 p-8 overflow-y-auto backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">User Detail</h3>
              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-zinc-900/40 border border-primary/10 rounded-2xl">
                <p className="text-lg font-black text-white mb-1">{selectedUser.name}</p>
                <p className="text-xs text-zinc-400">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Role', value: selectedUser.role },
                  { label: 'Plan', value: selectedUser.role === 'admin' || selectedUser.role === 'ceo' || selectedUser.role === 'owner' ? 'Admin' : selectedUser.plan },
                  { label: 'Admin', value: selectedUser.isAdmin ? 'Yes' : 'No' },
                  { label: 'Joined', value: new Date(selectedUser.created).toLocaleDateString() },
                ].map((field) => (
                  <div key={field.label} className="p-4 bg-zinc-900/20 border border-primary/5 rounded-xl">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">{field.label}</p>
                    <p className="text-xs font-bold text-zinc-200">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-primary/10">
                <button
                  onClick={async () => {
                    if (!selectedUser) return;
                    try {
                      const { supabase } = await import('../../services/database/supabase');
                      await supabase?.auth.signOut();
                      await import('../../services/analytics/analyticsService').then((m) =>
                        m.analyticsService.track('admin:impersonate', { targetUserId: selectedUser.id })
                      );
                      window.location.href = '/auth';
                    } catch {}
                  }}
                  className="w-full py-3 px-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all"
                >
                  Impersonate User
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
    </PageShell>
  );
};

export default AdminUsers;



