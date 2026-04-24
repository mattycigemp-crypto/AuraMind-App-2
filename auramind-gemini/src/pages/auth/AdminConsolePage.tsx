import React, { useState, useEffect } from 'react';
import { ShieldCheck, Crown, Command, Plus, Trash2, Loader2 } from 'lucide-react';
import { Deck, Card, UserProfile } from '../../types';
import { PageHeader, MetricTile } from '../../components/shared/PageComponents';
import { supabase } from '../../services/database/supabase';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  avatar?: string;
  lastSignIn?: string;
  created: string;
  plan: string;
}

export const AdminConsolePage = ({ user }: { decks: Deck[]; cards: Card[]; user: UserProfile }) => {
  const [panel, setPanel] = useState<'users' | 'analytics' | 'settings' | 'coupons'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [actionError, setActionError] = useState('');

  // Coupon Creation State
  const [newCoupon, setNewCoupon] = useState({
    id: '',
    name: '',
    percent_off: '',
    amount_off: '',
    duration: 'once',
    duration_in_months: '3'
  });
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/list-users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setAdminUsers(data.users || []);
    } catch (err: any) {
      setActionError(err.message || 'Could not load users. You may need to configure SUPABASE_SERVICE_ROLE_KEY.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/list-coupons', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setActionError(err.message || 'Could not load coupons.');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCoupon(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        ...newCoupon,
        percent_off: newCoupon.percent_off ? parseFloat(newCoupon.percent_off) : undefined,
        amount_off: newCoupon.amount_off ? parseInt(newCoupon.amount_off) * 100 : undefined, // Convert to cents
        duration_in_months: newCoupon.duration === 'repeating' ? parseInt(newCoupon.duration_in_months) : undefined,
      };

      const res = await fetch('/api/create-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      setNewCoupon({ id: '', name: '', percent_off: '', amount_off: '', duration: 'once', duration_in_months: '3' });
      fetchCoupons();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm(`Archive coupon ${couponId}?`)) return;
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/delete-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ couponId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchCoupons();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  useEffect(() => {
    if (user.isAdmin) {
      if (panel === 'users') fetchUsers();
      if (panel === 'coupons') fetchCoupons();
    }
  }, [user.isAdmin, panel]);

  if (!user.isAdmin) {
    return (
      <div className="space-y-10 py-4">
        <PageHeader title="ADMIN SUITE." subtitle="Restricted surface for staff roles only." />
        <div className="architectural-panel p-20 text-center space-y-6">
          <ShieldCheck size={64} className="mx-auto text-arch-muted" />
          <h2 className="text-arch-impact text-[32px] lowercase italic">Access Restricted.</h2>
          <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic max-w-xl mx-auto leading-loose">
            This control room is reserved for owners, admins, and moderators with elevated system permissions.
          </p>
          <button onClick={() => window.history.back()} className="btn-arch mt-8">Return to Base</button>
        </div>
      </div>
    );
  }

  const handleToggleAdmin = async (targetId: string, currentState: boolean) => {
    setActionError('');
    const previousUsers = [...adminUsers];
    // Optimistic update
    setAdminUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, isAdmin: !currentState } : u));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/toggle-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetUserId: targetId, makeAdmin: !currentState })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err: any) {
      setActionError(err.message || 'Failed to toggle admin status');
      setAdminUsers(previousUsers); // Revert
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="ADMIN SUITE." subtitle="User management and network control room." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricTile label="Total Users" value={adminUsers.length || '--'} detail="Registered accounts." />
        <MetricTile label="Admins" value={adminUsers.filter(u => u.isAdmin).length || '--'} detail="Elevated roles." />
        <MetricTile label="System Status" value="Online" detail="APIs operational." accent="text-emerald-400" />
        <MetricTile label="Latency" value="24ms" detail="Global edge routing." />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          ['users', 'User Management'],
          ['coupons', 'Promo Codes'],
          ['analytics', 'Analytics (Mock)'],
          ['settings', 'Platform Config'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setPanel(value as any)}
            className={`border p-6 text-left transition-all ${panel === value ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{label}</p>
          </button>
        ))}
      </div>

      <div className="architectural-panel p-8">
        <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-arch-border">
          <div>
            <p className="text-arch-eyebrow mb-2">Workspace Detail</p>
            <h2 className="text-3xl font-black italic lowercase">{panel} view.</h2>
          </div>
          <Crown size={18} className="text-arch-fg" />
        </div>

        {panel === 'users' && (
          <div className="space-y-6">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs font-black uppercase tracking-widest text-red-500">
                {actionError}
              </div>
            )}

            {loadingUsers && !adminUsers.length ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-arch-muted" size={24} /></div>
            ) : (
              <div className="border border-arch-border overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-arch-border bg-arch-fg/5">
                      {['User', 'Email', 'Joined', 'Plan', 'Role', 'Actions'].map((h) => (
                        <th key={h} className="p-5 text-[9px] font-black uppercase tracking-[0.4em] text-arch-muted whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-arch-border last:border-0 hover:bg-arch-fg/[0.02]">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-arch-fg/10 flex items-center justify-center overflow-hidden border border-arch-border">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover grayscale" /> : <span className="text-[10px] font-black">{u.name?.charAt(0) || '?'}</span>}
                            </div>
                            <span className="text-xs font-bold text-arch-fg">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-xs text-arch-muted italic tracking-widest">{u.email}</td>
                        <td className="p-5 text-[10px] text-arch-muted uppercase tracking-widest">
                          {new Date(u.created).toLocaleDateString()}
                        </td>
                        <td className="p-5">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-arch-fg/10 px-3 py-1 border border-arch-border">
                            {u.plan}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${u.isAdmin ? 'text-emerald-400' : 'text-arch-muted'}`}>
                            {u.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="p-5">
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                            disabled={u.email === 'matty.cigemp@gmail.com' || u.id === user.id}
                            className="btn-arch-outline px-4 py-2 text-[9px] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {panel === 'coupons' && (
          <div className="space-y-12">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs font-black uppercase tracking-widest text-red-500">
                {actionError}
              </div>
            )}

            {/* Create Coupon Form */}
            <div className="border border-arch-border bg-arch-fg/5 p-8 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Plus size={16} className="text-arch-fg" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Generate Promo Code</p>
              </div>
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Coupon ID (Optional)</p>
                  <input
                    value={newCoupon.id}
                    onChange={(e) => setNewCoupon({...newCoupon, id: e.target.value})}
                    placeholder="WINTER2025"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Internal Name</p>
                  <input
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                    placeholder="Winter Sale"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Percent Off</p>
                    <input
                      type="number"
                      value={newCoupon.percent_off}
                      onChange={(e) => setNewCoupon({...newCoupon, percent_off: e.target.value, amount_off: ''})}
                      placeholder="20"
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Amount ($)</p>
                    <input
                      type="number"
                      value={newCoupon.amount_off}
                      onChange={(e) => setNewCoupon({...newCoupon, amount_off: e.target.value, percent_off: ''})}
                      placeholder="10"
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Duration</p>
                  <select
                    value={newCoupon.duration}
                    onChange={(e) => setNewCoupon({...newCoupon, duration: e.target.value})}
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg appearance-none"
                  >
                    <option value="once">Once</option>
                    <option value="repeating">Repeating</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
                {newCoupon.duration === 'repeating' && (
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Months</p>
                    <input
                      type="number"
                      value={newCoupon.duration_in_months}
                      onChange={(e) => setNewCoupon({...newCoupon, duration_in_months: e.target.value})}
                      className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <button type="submit" disabled={isCreatingCoupon} className="btn-arch w-full">
                    {isCreatingCoupon ? 'Generating...' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Coupons */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Command size={16} className="text-arch-fg" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-fg">Active Registries</p>
              </div>

              {loadingCoupons && !coupons.length ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-arch-muted" size={24} /></div>
              ) : coupons.length === 0 ? (
                <div className="border border-arch-border bg-arch-fg/5 p-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted italic">No promo codes registered.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border border-arch-border bg-arch-fg/5 p-8 flex justify-between items-start group hover:border-arch-fg transition-all">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-black italic lowercase text-arch-fg">{coupon.id}</span>
                          {!coupon.valid && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-2 py-1 border border-red-500/20">Expired</span>}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-arch-muted italic">
                          {coupon.name || 'Unnamed Protocol'} • {coupon.duration}
                        </p>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-1 italic">Value</p>
                            <p className="text-xs font-black text-arch-fg">
                              {coupon.percent_off ? `${coupon.percent_off}% off` : `$${coupon.amount_off / 100} off`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-1 italic">Redeemed</p>
                            <p className="text-xs font-black text-arch-fg">{coupon.times_redeemed}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-arch-muted hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {panel === 'users' && (
          <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic mt-4">
            * Note: To view and edit all users, ensure you have set SUPABASE_SERVICE_ROLE_KEY in your Vercel Environment Variables.
          </p>
        )}

        {panel !== 'users' && panel !== 'coupons' && (
          <div className="py-20 text-center">
            <h3 className="text-xl font-black text-arch-muted italic lowercase">Module offline.</h3>
            <p className="text-[10px] uppercase tracking-widest text-arch-muted mt-4">This section is currently a placeholder.</p>
          </div>
        )}
      </div>
    </div>
  );
};
