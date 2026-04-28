import React, { useState, useEffect } from 'react';
import { ShieldCheck, Crown, Command, Plus, Trash2, Loader2 } from 'lucide-react';
import { Deck, Card, UserProfile, UserRole } from '../../types';
import { PageHeader, MetricTile } from '../../components/shared/PageComponents';
import { supabase } from '../../services/database/supabase';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, canManageRole, getPermissions } from '../../utils/permissions';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  role?: UserRole;
  avatar?: string;
  lastSignIn?: string;
  created: string;
  plan: string;
}

const AdminConsolePage = ({ user }: { decks: Deck[]; cards: Card[]; user: UserProfile }) => {
  const [panel, setPanel] = useState<'users' | 'analytics' | 'settings' | 'coupons' | 'testing'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [actionError, setActionError] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testMakeAdmin, setTestMakeAdmin] = useState(false);
  const [testRole, setTestRole] = useState<UserRole>(UserRole.USER);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

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
      const res = await fetch('/api/admin/list', {
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
      const res = await fetch('/api/coupons/list', {
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
        id: newCoupon.id || undefined,
        name: newCoupon.name || 'Coupon',
        percent_off: newCoupon.percent_off ? parseFloat(newCoupon.percent_off) : undefined,
        amount_off: newCoupon.amount_off ? parseInt(newCoupon.amount_off) * 100 : undefined, // Convert to cents
        duration: newCoupon.duration || 'once',
        duration_in_months: newCoupon.duration === 'repeating' ? parseInt(newCoupon.duration_in_months) : undefined,
      };

      const res = await fetch('/api/coupons/create', {
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
      const res = await fetch('/api/coupons/delete', {
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
      if (panel === 'testing') runSystemTests();
    }
  }, [user.isAdmin, panel]);

  const runSystemTests = async () => {
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch('/api/admin/test', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tests failed');
      setTestResults(data);
    } catch (err: any) {
      setActionError(err.message || 'System tests failed');
    }
  };

  const handleCreateTestUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/utility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'create_test_user',
          testData: {
            email: testEmail,
            password: testPassword,
            makeAdmin: testMakeAdmin,
            role: testRole
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create test user');

      setTestEmail('');
      setTestPassword('');
      alert('Test user created successfully!');
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/utility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_user_details',
          targetUserId: userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user details');

      setUserDetails(data.user);
      setSelectedUser(adminUsers.find(u => u.id === userId) || null);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSetSubscription = async (userId: string, status: string, plan: string) => {
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/utility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'set_subscription',
          targetUserId: userId,
          testData: { status, plan }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');

      alert('Subscription updated successfully!');
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    setChangingRole(true);
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/utility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'set_role',
          targetUserId: userId,
          testData: { role: newRole }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      alert('Role updated successfully!');
      fetchUsers();
      if (selectedUser?.id === userId) {
        handleViewUserDetails(userId);
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setChangingRole(false);
    }
  };

  const userRole = user.role || (user.email === 'matty.cigemp@gmail.com' ? UserRole.OWNER : UserRole.USER);
  const userPermissions = getPermissions(userRole);

  if (!userPermissions.canAccessAdminPanel) {
    return (
      <div className="space-y-10 py-4">
        <PageHeader title="ADMIN SUITE." subtitle="Restricted surface for staff roles only." />
        <div className="architectural-panel p-20 text-center space-y-6">
          <ShieldCheck size={64} className="mx-auto text-arch-muted" />
          <h2 className="text-arch-impact text-[32px] lowercase italic">Access Restricted.</h2>
          <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic max-w-xl mx-auto leading-loose">
            This control room is reserved for users with elevated system permissions.
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
          ['analytics', 'Analytics'],
          ['settings', 'Platform Config'],
          ['testing', 'Testing Tools'],
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
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${
                            u.role === UserRole.OWNER ? 'text-purple-400' :
                            u.role === UserRole.CEO ? 'text-blue-400' :
                            u.role === UserRole.ADMIN ? 'text-emerald-400' :
                            u.role === UserRole.EMPLOYEE ? 'text-yellow-400' :
                            'text-arch-muted'
                          }`}>
                            {ROLE_LABELS[u.role || UserRole.USER]}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewUserDetails(u.id)}
                              disabled={loadingDetails}
                              className="btn-arch-outline px-3 py-2 text-[9px]"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && userDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedUser(null); setUserDetails(null); }}>
            <div className="architectural-panel p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black italic lowercase text-arch-fg">User Details</h2>
                <button onClick={() => { setSelectedUser(null); setUserDetails(null); }} className="text-arch-muted hover:text-arch-fg">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">Email</p>
                    <p className="text-xs text-arch-fg">{selectedUser.email}</p>
                  </div>
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">Name</p>
                    <p className="text-xs text-arch-fg">{selectedUser.name}</p>
                  </div>
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">User ID</p>
                    <p className="text-xs text-arch-fg font-mono">{selectedUser.id}</p>
                  </div>
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">Plan</p>
                    <p className="text-xs text-arch-fg">{selectedUser.plan}</p>
                  </div>
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">Joined</p>
                    <p className="text-xs text-arch-fg">{new Date(selectedUser.created).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 border border-arch-border bg-arch-fg/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-2">Role</p>
                    <p className={`text-xs font-black ${
                      selectedUser.role === UserRole.OWNER ? 'text-purple-400' :
                      selectedUser.role === UserRole.CEO ? 'text-blue-400' :
                      selectedUser.role === UserRole.ADMIN ? 'text-emerald-400' :
                      selectedUser.role === UserRole.EMPLOYEE ? 'text-yellow-400' :
                      'text-arch-muted'
                    }`}>
                      {ROLE_LABELS[selectedUser.role || UserRole.USER]}
                    </p>
                  </div>
                </div>

                {userDetails.metadata && (
                  <div className="border border-arch-border bg-arch-fg/5 p-6">
                    <h3 className="text-sm font-black italic lowercase text-arch-fg mb-4">Metadata</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-arch-muted uppercase">Subscription Status</span>
                        <span className="text-[9px] font-black text-arch-fg">{userDetails.metadata.subscription_status || 'none'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-arch-muted uppercase">Stripe Customer</span>
                        <span className="text-[9px] font-mono text-arch-fg">{userDetails.metadata.stripe_customer_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-arch-muted uppercase">Stripe Subscription</span>
                        <span className="text-[9px] font-mono text-arch-fg">{userDetails.metadata.stripe_subscription_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-arch-muted uppercase">Trial End</span>
                        <span className="text-[9px] text-arch-fg">{userDetails.metadata.trial_end ? new Date(userDetails.metadata.trial_end).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-arch-border bg-arch-fg/5 p-6">
                  <h3 className="text-sm font-black italic lowercase text-arch-fg mb-4">Subscription Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSetSubscription(selectedUser.id, 'active', 'Pro')}
                      className="btn-arch px-4 py-3 text-[9px]"
                    >
                      Set Pro (Active)
                    </button>
                    <button
                      onClick={() => handleSetSubscription(selectedUser.id, 'trialing', 'Pro')}
                      className="btn-arch-outline px-4 py-3 text-[9px]"
                    >
                      Set Pro (Trial)
                    </button>
                    <button
                      onClick={() => handleSetSubscription(selectedUser.id, 'canceled', 'Starter')}
                      className="btn-arch-outline px-4 py-3 text-[9px]"
                    >
                      Cancel (Starter)
                    </button>
                    <button
                      onClick={() => handleSetSubscription(selectedUser.id, 'past_due', 'Starter')}
                      className="btn-arch-outline px-4 py-3 text-[9px]"
                    >
                      Past Due (Starter)
                    </button>
                  </div>
                </div>

                {userPermissions.canManageRoles && canManageRole(userRole, selectedUser.role || UserRole.USER) && (
                  <div className="border border-arch-border bg-arch-fg/5 p-6">
                    <h3 className="text-sm font-black italic lowercase text-arch-fg mb-4">Role Management</h3>
                    <p className="text-[9px] text-arch-muted uppercase tracking-widest mb-4">
                      Current: {ROLE_LABELS[selectedUser.role || UserRole.USER]}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.values(UserRole).map((role) => {
                        if (!canManageRole(userRole, role)) return null;
                        const isCurrentRole = selectedUser.role === role;
                        return (
                          <button
                            key={role}
                            onClick={() => handleChangeRole(selectedUser.id, role)}
                            disabled={changingRole || isCurrentRole}
                            className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${
                              isCurrentRole
                                ? 'bg-arch-fg text-arch-bg cursor-not-allowed'
                                : 'btn-arch-outline'
                            }`}
                          >
                            {ROLE_LABELS[role]} {isCurrentRole && '(Current)'}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[8px] text-arch-muted uppercase tracking-widest mt-4 italic">
                      {ROLE_DESCRIPTIONS[selectedUser.role || UserRole.USER]}
                    </p>
                  </div>
                )}
              </div>
            </div>
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

        {panel === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricTile label="Total Users" value={adminUsers.length || '--'} detail="Registered accounts" />
              <MetricTile label="Active Subscriptions" value={adminUsers.filter(u => u.plan === 'Pro').length || '--'} detail="Paying members" />
              <MetricTile label="Trial Users" value={adminUsers.filter(u => u.plan === 'Starter').length || '--'} detail="Free tier" />
              <MetricTile label="Admins" value={adminUsers.filter(u => u.isAdmin).length || '--'} detail="System administrators" />
            </div>

            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <h3 className="text-lg font-black italic lowercase text-arch-fg mb-6">User Growth</h3>
              <div className="space-y-4">
                {adminUsers.slice(0, 10).map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-arch-border bg-arch-bg">
                    <div className="flex items-center gap-3">
                      <span className="text-arch-muted text-xs">#{i + 1}</span>
                      <span className="text-xs font-bold text-arch-fg">{u.name}</span>
                    </div>
                    <span className="text-[10px] text-arch-muted uppercase tracking-widest">
                      {new Date(u.created).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {panel === 'settings' && (
          <div className="space-y-8">
            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <h3 className="text-lg font-black italic lowercase text-arch-fg mb-6">System Configuration</h3>
              <div className="space-y-6">
                <div className="p-4 border border-arch-border bg-arch-bg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-muted mb-2">Environment</p>
                  <p className="text-xs text-arch-fg">{process.env.NODE_ENV || 'production'}</p>
                </div>
                <div className="p-4 border border-arch-border bg-arch-bg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-muted mb-2">Supabase URL</p>
                  <p className="text-xs text-arch-fg font-mono">{process.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}</p>
                </div>
                <div className="p-4 border border-arch-border bg-arch-bg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-muted mb-2">Service Role Key</p>
                  <p className="text-xs text-arch-fg font-mono">{process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Configured' : '✗ Missing'}</p>
                </div>
                <div className="p-4 border border-arch-border bg-arch-bg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-muted mb-2">Stripe Secret</p>
                  <p className="text-xs text-arch-fg font-mono">{process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Missing'}</p>
                </div>
              </div>
            </div>

            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <h3 className="text-lg font-black italic lowercase text-arch-fg mb-6">Documentation</h3>
              <p className="text-[9px] text-arch-muted uppercase tracking-widest italic">
                See ADMIN_GUIDE.md in the project root for complete documentation on admin features, testing utilities, and API endpoints.
              </p>
            </div>
          </div>
        )}

        {panel === 'testing' && (
          <div className="space-y-8">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs font-black uppercase tracking-widest text-red-500">
                {actionError}
              </div>
            )}

            {/* System Tests */}
            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black italic lowercase text-arch-fg">System Diagnostics</h3>
                <button onClick={runSystemTests} className="btn-arch-outline px-4 py-2 text-[9px]">
                  Run Tests
                </button>
              </div>

              {testResults ? (
                <div className="space-y-4">
                  <div className="p-4 border border-arch-border bg-arch-bg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-arch-muted mb-2">Overall Status</p>
                    <p className={`text-xs font-black ${testResults.summary?.overallStatus === 'healthy' ? 'text-emerald-400' : 'text-red-500'}`}>
                      {testResults.summary?.overallStatus || 'Unknown'}
                    </p>
                    <p className="text-[9px] text-arch-muted mt-2">
                      {testResults.summary?.passed || 0} passed, {testResults.summary?.failed || 0} failed, {testResults.summary?.skipped || 0} skipped
                    </p>
                  </div>

                  {testResults.tests?.map((test: any, i: number) => (
                    <div key={i} className="p-4 border border-arch-border bg-arch-bg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-arch-fg">{test.name}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          test.status === 'passed' ? 'text-emerald-400' : 
                          test.status === 'failed' ? 'text-red-500' : 'text-arch-muted'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-arch-muted">{test.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-arch-muted uppercase tracking-widest italic">
                  Click "Run Tests" to check system health
                </p>
              )}
            </div>

            {/* Create Test User */}
            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <h3 className="text-lg font-black italic lowercase text-arch-fg mb-6">Create Test User</h3>
              <form onSubmit={handleCreateTestUser} className="space-y-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Email</p>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    required
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Password</p>
                  <input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg"
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="makeAdmin"
                    checked={testMakeAdmin}
                    onChange={(e) => setTestMakeAdmin(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="makeAdmin" className="text-[9px] font-black uppercase tracking-widest text-arch-fg">
                    Grant Admin Access
                  </label>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-arch-muted mb-3 italic">Role</p>
                  <select
                    value={testRole}
                    onChange={(e) => setTestRole(e.target.value as UserRole)}
                    className="w-full bg-arch-bg border border-arch-border p-4 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg appearance-none"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-arch w-full">
                  Create Test User
                </button>
              </form>
            </div>

            {/* Testing Guide */}
            <div className="border border-arch-border bg-arch-fg/5 p-8">
              <h3 className="text-lg font-black italic lowercase text-arch-fg mb-6">Testing Guide</h3>
              <div className="space-y-4 text-[9px] text-arch-muted uppercase tracking-widest">
                <p>1. Use "Create Test User" to generate test accounts</p>
                <p>2. Grant admin access to test admin-specific features</p>
                <p>3. Run system diagnostics to check API integrations</p>
                <p>4. Test subscription flows with test users</p>
                <p>5. Verify admin permissions and access controls</p>
                <p className="text-arch-fg mt-4">Admins automatically get free access to all features</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsolePage;
