import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../../components/dashboard/PageShell';
import { cn } from '../../lib/utils';
import {
  UserPlusIcon as UserPlus,
  GraduationCapIcon as GraduationCap,
  ShieldIcon as Shield,
  ShieldCheckIcon as Briefcase,
  UserIcon as User,
  Trash2Icon as Trash2,
  XIcon as X,
  CheckIcon as Check,
  AlertTriangleIcon as AlertTriangle,
  Loader2Icon as Loader2,
  CopyIcon as Copy,
  SparklesIcon as Sparkles,
  SearchIcon as Search,
} from '../../components/icons/CustomIcons';

interface CreatedUser {
  id: string;
  email: string;
  password: string;        // plain-text shown back to admin only
  persona: 'teacher' | 'student' | 'admin' | 'employee';
  plan: string;
  createdAt: number;
  status?: 'pending' | 'created' | 'error';
  error?: string;
}

const STORAGE_KEY = 'auramind-admin-test-users-v1';

function loadCreated(): CreatedUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCreated(items: CreatedUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {/* ignore */}
}

interface AdminTestUsersProps {
  className?: string;
}

const PERSONAS: {
  key: CreatedUser['persona'];
  label: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent: string;
  plan: string;
  role: 'user' | 'employee' | 'admin';
  demoEmail: string;
  password: string;
}[] = [
  {
    key: 'student',
    label: 'Student',
    description: 'Standard account, basic FSRS, study sessions, assignment receipts.',
    icon: User,
    accent: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    plan: 'Starter',
    role: 'user',
    demoEmail: 'student.test@auramind.app',
    password: 'AuraStudent2026!',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    description: 'Persona=teacher: classrooms, cohort access, can create assignments.',
    icon: GraduationCap,
    accent: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    plan: 'Pro',
    role: 'user', // persona flag on user role, not elevated role
    demoEmail: 'teacher.test@auramind.app',
    password: 'AuraTeacher2026!',
  },
  {
    key: 'employee',
    label: 'Employee',
    description: 'Staff account, analytics view, support tooling enabled.',
    icon: Briefcase,
    accent: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    plan: 'Pro',
    role: 'employee',
    demoEmail: 'staff.test@auramind.app',
    password: 'AuraStaff2026!',
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Full admin console access (system tier — use sparingly).',
    icon: Shield,
    accent: 'from-primary/20 to-purple-500/20 border-primary/30',
    plan: 'Scholar',
    role: 'admin',
    demoEmail: 'admin.test@auramind.app',
    password: 'AuraAdmin2026!',
  },
];

async function adminApiCall(action: string, body?: Record<string, any>) {
  const { supabase } = await import('../../services/database/supabase');
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const AdminTestUsers: React.FC<AdminTestUsersProps> = ({ className }) => {
  const [created, setCreated] = useState<CreatedUser[]>(loadCreated);
  const [creating, setCreating] = useState<CreatedUser['persona'] | null>(null);
  const [search, setSearch] = useState('');
  const [confirmPurge, setConfirmPurge] = useState<'all' | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveCreated(created);
  }, [created]);

  const createTestUser = useCallback(async (personaKey: CreatedUser['persona'], overrides?: Partial<{ email: string; password: string }>) => {
    const persona = PERSONAS.find((p) => p.key === personaKey)!;
    const email = overrides?.email || persona.demoEmail;
    const password = overrides?.password || persona.password;

    setCreating(personaKey);
    setError(null);

    const newItem: CreatedUser = {
      id: `local-${Date.now().toString(36)}`,
      email,
      password,
      persona: personaKey,
      plan: persona.plan,
      createdAt: Date.now(),
      status: 'pending',
    };
    setCreated((prev) => [newItem, ...prev]);

    try {
      await adminApiCall('utility', {
        action: 'create_test_user',
        testData: {
          email,
          password,
          role: persona.role,
          makeAdmin: persona.role === 'admin',
          plan: persona.plan,
          // Persona is a *product* concept (teacher/student/employee), not a system-role tier.
          // 'admin' personas use the system admin role instead, so we don't forward persona for them.
          ...(personaKey !== 'admin' ? { persona: personaKey } : {}),
        },
      });
      setCreated((prev) =>
        prev.map((u) => (u.id === newItem.id ? { ...u, status: 'created' } : u)),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create test user');
      setCreated((prev) =>
        prev.map((u) => (u.id === newItem.id ? { ...u, status: 'error', error: err.message } : u)),
      );
    } finally {
      setCreating(null);
    }
  }, []);

  const bulkCreateAllPersonas = async () => {
    for (const persona of PERSONAS) {
      // De-dupe email so we can quickly re-run
      const counter = created.filter((c) => c.email.startsWith(persona.demoEmail.replace('@', '.') + '.')).length;
      const email = counter > 0 ? persona.demoEmail.replace('@', `.${counter + 1}@`) : persona.demoEmail;
      await createTestUser(persona.key, { email });
    }
  };

  const deleteCreated = (id: string) => {
    setCreated((prev) => prev.filter((u) => u.id !== id));
  };

  const purgeAll = async () => {
    // close the dialog first
    setConfirmPurge(null);
    // Note: this only clears local storage of the locally-tracked users.
    // To delete the actual Supabase auth users, hit /api/admin/bulk with delete_test_users action.
    setCreated([]);
    // Optional: dispatch server-side purge
    try {
      await adminApiCall('bulk', { action: 'delete_test_users' });
    } catch {
      // server-side action may not exist yet — local purge still useful
    }
  };

  const copyCreds = (u: CreatedUser) => {
    navigator.clipboard.writeText(`Email: ${u.email}\nPassword: ${u.password}`).catch(() => {});
  };

  const filtered = created.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return u.email.toLowerCase().includes(q) || u.persona.includes(q);
  });

  return (
    <PageShell>
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            <UserPlus size={12} className="text-primary" />
            Test Users · Sandbox
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Spin up accounts for any persona — student, teacher, employee, admin. All credentials persist locally for easy recovery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={bulkCreateAllPersonas}
            disabled={creating !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-50 transition-all"
          >
            <Sparkles size={11} />
            Quick seed all personas
          </button>
          <button
            onClick={() => setConfirmPurge('all')}
            disabled={created.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] text-amber-300 text-[10px] font-bold uppercase tracking-[0.15em] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/10 transition-all"
          >
            <Trash2 size={11} />
            Purge ({created.length})
          </button>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-[11px] text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isLoading = creating === p.key;
          const hasCreated = created.some((u) => u.persona === p.key);
          return (
            <motion.div
              key={p.key}
              whileHover={{ y: -2 }}
              className={cn('p-4 rounded-2xl border backdrop-blur-sm transition-all', `bg-gradient-to-br ${p.accent}`)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-zinc-950/50 border border-zinc-700/40 flex items-center justify-center">
                  <Icon size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-white uppercase tracking-[0.1em]">{p.label}</div>
                  <div className="text-[9px] text-zinc-400 font-mono">{p.plan}</div>
                </div>
                {hasCreated && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                    SEEDED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">{p.description}</p>
              <button
                onClick={() => createTestUser(p.key)}
                disabled={isLoading || creating !== null}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-700/30 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-100 hover:bg-zinc-950 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                {isLoading ? 'Creating…' : `Create ${p.label}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search created accounts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/10 border border-zinc-700/30 text-[11px] text-zinc-300 focus:outline-none focus:border-primary/40 transition-all"
          />
        </div>
        <div className="text-[9px] text-zinc-500 font-mono">
          {filtered.length} of {created.length} shown
        </div>
      </div>

      {/* Created users table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-700/30">
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3">Persona</th>
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3">Email</th>
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3">Password</th>
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3">Plan</th>
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3">Status</th>
                <th className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const p = PERSONAS.find((x) => x.key === u.persona)!;
                const Icon = p.icon;
                return (
                  <tr key={u.id} className="border-b border-zinc-700/20 hover:bg-zinc-900/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className="text-primary" />
                        <span className="text-[11px] font-bold text-white capitalize">{u.persona}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-zinc-300">{u.email}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-zinc-500">{u.password}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-zinc-400">{u.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-[0.1em]',
                        u.status === 'created' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                        u.status === 'pending' && 'bg-blue-500/10 border-blue-500/30 text-blue-300',
                        u.status === 'error' && 'bg-red-500/10 border-red-500/30 text-red-300',
                      )}>
                        {u.status === 'created' && <Check size={9} />}
                        {u.status === 'error' && <AlertTriangle size={9} />}
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyCreds(u)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-primary hover:bg-zinc-800/40 transition-all"
                          title="Copy credentials"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmPurge(u.id)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/40 transition-all"
                          title="Remove from tracker"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm text-center">
          <UserPlus size={28} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-[11px] text-zinc-500 font-bold">No test users created yet</p>
          <p className="text-[10px] text-zinc-600 mt-1">Click any persona card above to create one.</p>
        </div>
      )}

      {/* Danger zone note */}
      <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2 text-[11px] text-amber-200/80">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Important:</strong> Purge only removes these accounts from the local admin tracker and (if the server endpoint exists) from Supabase Auth. Real usage data and decks are <strong>not</strong> cleaned up automatically — use Admin → SQL Console to drop associated rows.
        </div>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmPurge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setConfirmPurge(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-[0.1em]">
                    {confirmPurge === 'all' ? 'Purge all tracked test users?' : 'Remove from tracker?'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {confirmPurge === 'all'
                      ? `This removes all ${created.length} test-user entries from the admin tracker and (if available) purges them server-side.`
                      : 'This only removes the entry from the admin tracker. The Supabase Auth account must be purged manually via the SQL console.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-5 pt-4 border-t border-zinc-700/30">
                <button onClick={() => setConfirmPurge(null)} className="flex-1 px-4 py-2 rounded-xl bg-zinc-900/50 text-zinc-300 text-[11px] font-bold hover:bg-zinc-900/80 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmPurge === 'all') purgeAll();
                    else deleteCreated(confirmPurge);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-amber-950 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-amber-400 shadow-lg shadow-amber-500/30 transition-all"
                >
                  Purge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageShell>
  );
};

export default AdminTestUsers;
