import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import {
  SearchIcon as Search,
  ShieldIcon as Shield,
  EyeIcon as Eye,
  XCircleIcon as XCircle,
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
    <div className={cn("relative", className)}>
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-primary/10 rounded-2xl text-sm text-zinc-100 focus:outline-none focus:border-primary/40 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-primary/10">
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
                  className="border-b border-primary/5 hover:bg-primary/[0.02] transition-colors group"
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
                        ? 'bg-primary/10 text-primary'
                        : 'bg-zinc-800/50 text-zinc-400'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] text-zinc-400">{user.plan}</span>
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
      {detailDrawerOpen && selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setDetailDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-zinc-950 border-l border-primary/10 z-50 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
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
                  { label: 'Plan', value: selectedUser.plan },
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
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;



