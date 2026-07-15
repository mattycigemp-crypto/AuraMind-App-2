import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import PageShell from '../../components/dashboard/PageShell';
import {
  ShieldIcon as Shield,
  CrownIcon as Crown,
  GraduationCapIcon as GraduationCap,
  UserIcon as User,
  LockIcon as Lock,
  CheckIcon as Check,
  SearchIcon as Search,
  AlertTriangleIcon as AlertTriangle,
  SaveIcon as Save,
  RotateCcwIcon as RotateCcw,
} from '../../components/icons/CustomIcons';

export type RoleLevel = 'owner' | 'ceo' | 'admin' | 'employee' | 'teacher' | 'student' | 'user';

export type PermissionKey = 'read' | 'write' | 'execute' | 'delete';
export type ModuleKey =
  | 'users'
  | 'decks'
  | 'cards'
  | 'subscriptions'
  | 'chat'
  | 'analytics'
  | 'audit'
  | 'settings'
  | 'sql';

export type PermissionMatrix = Record<RoleLevel, Record<ModuleKey, PermissionKey[]>>;
export type PersonaMatrix = Record<'teacher' | 'student', { canCreateAssignments: boolean; canViewClassrooms: boolean; cohortAccess: boolean }>;

const STORAGE_KEY = 'auramind-admin-role-matrix-v1';

const ROLES: { key: RoleLevel; label: string; rank: number; persona?: 'teacher' | 'student'; desc: string }[] = [
  { key: 'owner', label: 'Owner', rank: 100, desc: 'Full system access; financial controls, payment keys, root config.' },
  { key: 'ceo', label: 'CEO', rank: 90, desc: 'Executive oversight; full audit read, analytics, can manage admins.' },
  { key: 'admin', label: 'Admin', rank: 80, desc: 'Day-to-day operations; user management, content moderation.' },
  { key: 'employee', label: 'Employee', rank: 50, desc: 'Staff access; analytics view, support tooling.' },
  { key: 'teacher', label: 'Teacher', rank: 40, persona: 'teacher', desc: 'Persona — teacher features: classrooms, assignments, cohorts.' },
  { key: 'student', label: 'Student', rank: 20, persona: 'student', desc: 'Persona — student features: assignment receipts, peer review.' },
  { key: 'user', label: 'User', rank: 10, desc: 'Standard account; personal decks, study sessions.' },
];

const MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: 'users', label: 'Users', description: 'User accounts, roles, subscriptions' },
  { key: 'decks', label: 'Decks', description: 'Flashcard decks library' },
  { key: 'cards', label: 'Cards', description: 'Individual flashcards and FSRS state' },
  { key: 'subscriptions', label: 'Subscriptions', description: 'Plans, billing, Stripe data' },
  { key: 'chat', label: 'Chat', description: 'AI conversations, source grounding' },
  { key: 'analytics', label: 'Analytics', description: 'Platform metrics, dashboards' },
  { key: 'audit', label: 'Audit Log', description: 'System activity trail' },
  { key: 'settings', label: 'Settings', description: 'System configuration' },
  { key: 'sql', label: 'SQL Console', description: 'Raw database query access' },
];

const DEFAULT_MATRIX: PermissionMatrix = {
  owner:    { users:['read','write','execute','delete'], decks:['read','write','execute','delete'], cards:['read','write','execute','delete'], subscriptions:['read','write','execute','delete'], chat:['read','write','execute','delete'], analytics:['read','write','execute'], audit:['read','write','execute'], settings:['read','write','execute','delete'], sql:['read','write','execute','delete'] },
  ceo:      { users:['read','write'], decks:['read'], cards:['read'], subscriptions:['read','write'], chat:['read'], analytics:['read','write','execute'], audit:['read','write'], settings:['read','write'], sql:['read'] },
  admin:    { users:['read','write','execute'], decks:['read','write','execute','delete'], cards:['read','write','execute','delete'], subscriptions:['read','write'], chat:['read','write','execute'], analytics:['read','write'], audit:['read','write'], settings:['read','write'], sql:['read'] },
  employee: { users:['read'], decks:['read','write'], cards:['read','write'], subscriptions:['read'], chat:['read'], analytics:['read'], audit:['read'], settings:['read'], sql:[] },
  teacher:  { users:[], decks:['read','write','execute'], cards:['read','write','execute','delete'], subscriptions:[], chat:['read','write'], analytics:['read'], audit:[], settings:[], sql:[] },
  student:  { users:[], decks:['read','write'], cards:['read','write'], subscriptions:[], chat:['read','write'], analytics:[], audit:[], settings:[], sql:[] },
  user:     { users:[], decks:['read','write'], cards:['read','write'], subscriptions:[], chat:['read','write'], analytics:[], audit:[], settings:[], sql:[] },
};

const DEFAULT_PERSONAS: PersonaMatrix = {
  teacher: { canCreateAssignments: true, canViewClassrooms: true, cohortAccess: true },
  student: { canCreateAssignments: false, canViewClassrooms: true, cohortAccess: false },
};

function loadMatrix(): PermissionMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MATRIX;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MATRIX;
  }
}

function loadPersonas(): PersonaMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '-personas');
    if (!raw) return DEFAULT_PERSONAS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PERSONAS;
  }
}

interface AdminRolesProps {
  className?: string;
}

const ALL_PERMS: PermissionKey[] = ['read', 'write', 'execute', 'delete'];

const AdminRoles: React.FC<AdminRolesProps> = ({ className }) => {
  const [matrix, setMatrix] = useState<PermissionMatrix>(loadMatrix);
  const [personas, setPersonas] = useState<PersonaMatrix>(loadPersonas);
  const [selectedRole, setSelectedRole] = useState<RoleLevel>('admin');
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
    } catch {/* ignore */}
  }, [matrix]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '-personas', JSON.stringify(personas));
    } catch {/* ignore */}
  }, [personas]);

  const togglePermission = (role: RoleLevel, module: ModuleKey, perm: PermissionKey) => {
    setMatrix((prev) => {
      const current = prev[role][module];
      const exists = current.includes(perm);
      const next = exists ? current.filter((p) => p !== perm) : [...current, perm];
      return { ...prev, [role]: { ...prev[role], [module]: next } };
    });
  };

  const resetToDefaults = () => {
    if (!confirm('Reset all roles to default permissions? This cannot be undone.')) return;
    setMatrix(DEFAULT_MATRIX);
    setPersonas(DEFAULT_PERSONAS);
  };

  const selectedRoleMeta = ROLES.find((r) => r.key === selectedRole)!;

  return (
    <PageShell>
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            <Shield size={12} className="text-primary" />
            Role Permission Matrix
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">Read · Write · Execute · Delete per module for each role.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <RotateCcw size={11} />
            Reset to Defaults
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Save size={11} />
            Save (auto)
          </button>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map((role) => {
          const isActive = selectedRole === role.key;
          const Icon = role.rank === 100 ? Crown : role.persona ? GraduationCap : role.rank >= 50 ? Shield : User;
          const colorClass = role.rank >= 90
            ? 'text-amber-300 border-amber-500/30 bg-amber-500/[0.04]'
            : role.rank >= 80
              ? 'text-primary border-primary/30 bg-primary/[0.04]'
              : role.rank >= 50
                ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/[0.04]'
                : role.persona === 'teacher'
                  ? 'text-blue-300 border-blue-500/30 bg-blue-500/[0.04]'
                  : role.persona === 'student'
                    ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/[0.04]'
                    : 'text-zinc-300 border-zinc-700/30 bg-zinc-900/10';
          return (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={cn(
                'p-3 rounded-2xl border text-left transition-all',
                isActive ? `${colorClass} ring-1 ring-current` : `${colorClass} opacity-70 hover:opacity-100`,
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{role.label}</span>
              </div>
              <div className="text-[8px] font-mono text-zinc-500">LVL {role.rank}</div>
              {role.persona && (
                <div className="text-[8px] text-zinc-500 mt-1 font-mono">persona:{role.persona}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-5">
        {/* Role detail panel */}
        <motion.div
          key={selectedRole}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/40 border border-zinc-700/30 text-zinc-500">LVL {selectedRoleMeta.rank}</span>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.1em]">{selectedRoleMeta.label}</h3>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{selectedRoleMeta.desc}</p>

          {/* Persona flags (Teacher/Student) */}
          {selectedRoleMeta.persona && (
            <div className="mt-4 pt-4 border-t border-zinc-700/30 space-y-2">
              <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-1.5">Persona Flags</div>
              {([
                ['canCreateAssignments', 'Create assignments'],
                ['canViewClassrooms', 'View classrooms'],
                ['cohortAccess', 'Cohort access'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPersonas((p) => ({
                    ...p,
                    [selectedRoleMeta.persona!]: { ...p[selectedRoleMeta.persona!], [key]: !p[selectedRoleMeta.persona!][key] },
                  }))}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-all border border-zinc-700/20"
                >
                  <span className="text-[11px] text-zinc-300 font-medium">{label}</span>
                  <div className={cn(
                    'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                    personas[selectedRoleMeta.persona][key] ? 'bg-primary' : 'bg-zinc-700',
                  )}>
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                      className={cn(
                        'inline-block h-2.5 w-2.5 rounded-full bg-zinc-950',
                        personas[selectedRoleMeta.persona][key] ? 'translate-x-4' : 'translate-x-1',
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-zinc-700/30 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Permissions</div>
              <div className="text-lg font-black text-white mt-1">
                {Object.values(matrix[selectedRole]).reduce((acc, perms) => acc + perms.length, 0)}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Active Modules</div>
              <div className="text-lg font-black text-white mt-1">
                {Object.values(matrix[selectedRole]).filter((p) => p.length > 0).length} / {MODULES.length}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-200/80">
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            <span>Owner and CEO are protected system tiers. Changes propagate to all matching accounts immediately.</span>
          </div>
        </motion.div>

        {/* Permission matrix */}
        <div className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
              <Lock size={12} className="text-primary" />
              Permission Grid · {selectedRoleMeta.label}
            </h3>
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter modules…"
                className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900/30 border border-zinc-700/30 text-[10px] text-zinc-300 focus:outline-none focus:border-primary/40 w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-700/30">
                  <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 pb-3 pr-4">Module</th>
                  {ALL_PERMS.map((p) => (
                    <th key={p} className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 pb-3 px-1 text-center">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.filter((m) => !search || m.label.toLowerCase().includes(search.toLowerCase())).map((m) => {
                  const perms = matrix[selectedRole][m.key];
                  return (
                    <tr key={m.key} className="border-b border-zinc-700/20 hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="text-[11px] font-bold text-zinc-200">{m.label}</div>
                        <div className="text-[9px] text-zinc-500">{m.description}</div>
                      </td>
                      {ALL_PERMS.map((p) => {
                        const on = perms.includes(p);
                        const requiredOrder: PermissionKey[] = ['read', 'write', 'execute', 'delete'];
                        const requiredIdx = requiredOrder.indexOf(p);
                        // Enforce hierarchy: read < write < execute < delete
                        const missingPrereq = requiredIdx > 0 && !perms.includes(requiredOrder[requiredIdx - 1]);
                        return (
                          <td key={p} className="py-3 px-1 text-center">
                            <button
                              onClick={() => !missingPrereq && togglePermission(selectedRole, m.key, p)}
                              disabled={missingPrereq}
                              title={missingPrereq ? `Requires ${requiredOrder[requiredIdx - 1]} first` : ''}
                              className={cn(
                                'w-7 h-7 rounded-md border flex items-center justify-center mx-auto transition-all',
                                missingPrereq
                                  ? 'border-zinc-800/40 bg-zinc-900/10 opacity-30 cursor-not-allowed'
                                  : on
                                    ? 'border-primary/40 bg-primary/20 text-primary hover:bg-primary/30'
                                    : 'border-zinc-700/30 bg-zinc-900/20 text-zinc-600 hover:border-zinc-700/50 hover:text-zinc-400',
                              )}
                            >
                              {on && <Check size={11} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[9px] text-zinc-500 italic">
            Permissions follow hierarchy: <code className="font-mono text-zinc-400">read</code> →{' '}
            <code className="font-mono text-zinc-400">write</code> →{' '}
            <code className="font-mono text-zinc-400">execute</code> →{' '}
            <code className="font-mono text-zinc-400">delete</code>. Each level is gated by the previous.
          </div>
        </div>
      </div>
      </div>
    </PageShell>
  );
};

export default AdminRoles;
