import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import PageShell from '../../components/dashboard/PageShell';
import { FLAGS_CHANGED_EVENT } from '../../hooks/useFeatureFlag';
import {
  SparklesIcon as Sparkles,
  PlusIcon as Plus,
  SearchIcon as Search,
  Trash2Icon as Trash2,
  RefreshCwIcon as RefreshCw,
  PencilIcon as Pencil,
  XIcon as X,
  CheckIcon as Check,
  AlertTriangleIcon as AlertTriangle,
  SettingsIcon as Settings,
  ZapIcon as Zap,
  CodeIcon as Code,
  BotIcon as Bot,
  SaveIcon as Save,
} from '../../components/icons/CustomIcons';

export type FlagStatus = 'live' | 'beta' | 'alpha' | 'deprecated' | 'draft';
export type FlagAudience = 'all' | 'admin' | 'teacher' | 'student' | 'pro' | 'ceo';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'ai' | 'study' | 'integrations' | 'social' | 'experimental';
  status: FlagStatus;
  enabled: boolean;
  rollout: number; // 0..100
  audience: FlagAudience;
  owner: string;
  lastModified: number;
  notes?: string;
}

const STORAGE_KEY = 'auramind-admin-feature-flags-v1';

const SEED_FLAGS: FeatureFlag[] = [
  {
    id: 'flag-ai-voice',
    key: 'ai_voice_mode',
    name: 'AI Voice Mode',
    description: 'Hands-free spoken conversations with Aura — TTS + STT pipeline during study sessions.',
    category: 'ai',
    status: 'live',
    enabled: true,
    rollout: 100,
    audience: 'all',
    owner: 'Aura Team',
    lastModified: Date.now() - 86_400_000 * 3,
    notes: 'Stable on iOS/Android via Capacitor Haptics + native SpeechRecognition.',
  },
  {
    id: 'flag-notion-sync',
    key: 'notion_sync_v2',
    name: 'Notion Sync v2',
    description: 'Two-way Notion database sync — import pages as decks, export flashcard stats back to Notion properties.',
    category: 'integrations',
    status: 'beta',
    enabled: true,
    rollout: 35,
    audience: 'pro',
    owner: 'Integrations Squad',
    lastModified: Date.now() - 86_400_000,
    notes: 'Currently 35% rollout to Pro plan. Watching API rate-limit issues.',
  },
  {
    id: 'flag-brainmap-3d',
    key: 'brainmap_3d',
    name: 'Brainmap 3D',
    description: 'Three.js-powered knowledge graph visualization — explore concept relationships in 3D space.',
    category: 'study',
    status: 'beta',
    enabled: true,
    rollout: 15,
    audience: 'admin',
    owner: 'Visualization',
    lastModified: Date.now() - 86_400_000 * 7,
    notes: 'Be sure to test on low-end Android. WebGL fallback is enabled automatically.',
  },
  {
    id: 'flag-multiplayer',
    key: 'multiplayer_rooms',
    name: 'Multiplayer Study Rooms',
    description: 'Real-time collaborative study rooms with shared decks, leaderboards, and live chat.',
    category: 'social',
    status: 'alpha',
    enabled: false,
    rollout: 5,
    audience: 'teacher',
    owner: 'Social Pod',
    lastModified: Date.now() - 86_400_000 * 2,
    notes: 'Behind the scenes: Supabase Realtime channels + presence broadcast.',
  },
  {
    id: 'flag-course-builder',
    key: 'course_builder',
    name: 'Course Builder',
    description: 'Multi-module curricula with assignments, peer review, and instructor-led cohorts.',
    category: 'study',
    status: 'alpha',
    enabled: false,
    rollout: 10,
    audience: 'teacher',
    owner: 'Education Team',
    lastModified: Date.now() - 86_400_000 * 10,
  },
  {
    id: 'flag-voice-coach',
    key: 'voice_coach',
    name: 'Voice Coach',
    description: 'AI motivational coach during study sessions — adapts tone to recent performance.',
    category: 'ai',
    status: 'draft',
    enabled: false,
    rollout: 0,
    audience: 'pro',
    owner: 'Aura Team',
    lastModified: Date.now() - 86_400_000 * 14,
  },
  {
    id: 'flag-ar-cards',
    key: 'ar_flashcards',
    name: 'AR Flashcards',
    description: 'AR mode — point camera at physical objects to instantly generate flashcards.',
    category: 'experimental',
    status: 'alpha',
    enabled: false,
    rollout: 2,
    audience: 'admin',
    owner: 'Hardware Hackers',
    lastModified: Date.now() - 86_400_000 * 21,
    notes: 'Requires ARKit (iOS) or ARCore (Android). WebXR fallback in development.',
  },
  {
    id: 'flag-mindmap-export',
    key: 'mindmap_pdf_export',
    name: 'Mind Map → PDF',
    description: 'Export generated mind maps as beautiful, paginated PDFs with cover pages and a study schedule.',
    category: 'study',
    status: 'live',
    enabled: true,
    rollout: 100,
    audience: 'all',
    owner: 'Visualization',
    lastModified: Date.now() - 86_400_000 * 30,
  },
];

const STATUS_COLORS: Record<FlagStatus, { bg: string; text: string; dot: string }> = {
  live: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  beta: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
  alpha: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
  deprecated: { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', dot: 'bg-zinc-500' },
  draft: { bg: 'bg-primary/10 border-primary/20', text: 'text-primary', dot: 'bg-primary' },
};

const CATEGORY_ICONS: Record<FeatureFlag['category'], React.FC<{ size?: number; className?: string }>> = {
  ai: Bot,
  study: Sparkles,
  integrations: Code,
  social: Zap,
  experimental: Settings,
};

function loadFlags(): FeatureFlag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_FLAGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return SEED_FLAGS;
  } catch {
    return SEED_FLAGS;
  }
}

function saveFlags(flags: FeatureFlag[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    // Notify all useFeatureFlag hooks so changes apply instantly across the app
    window.dispatchEvent(new Event(FLAGS_CHANGED_EVENT));
  } catch {
    // ignore quota errors
  }
}

interface AdminFeatureFlagsProps {
  className?: string;
}

const AdminFeatureFlags: React.FC<AdminFeatureFlagsProps> = ({ className }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>(loadFlags);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | FlagStatus>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    saveFlags(flags);
  }, [flags]);

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      const q = search.toLowerCase().trim();
      if (q && !(`${f.name} ${f.key} ${f.description}`.toLowerCase().includes(q))) return false;
      if (filter !== 'all' && f.status !== filter) return false;
      return true;
    });
  }, [flags, search, filter]);

  const updateFlag = (id: string, patch: Partial<FeatureFlag>) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch, lastModified: Date.now() } : f)),
    );
  };

  const deleteFlag = (id: string) => {
    if (!confirm('Delete this feature flag? This cannot be undone.')) return;
    setFlags((prev) => prev.filter((f) => f.id !== id));
  };

  const addFlag = (flag: FeatureFlag) => {
    setFlags((prev) => [flag, ...prev]);
    setShowAdd(false);
  };

  const stats = useMemo(() => ({
    total: flags.length,
    live: flags.filter((f) => f.status === 'live').length,
    beta: flags.filter((f) => f.status === 'beta').length,
    alpha: flags.filter((f) => f.status === 'alpha').length,
    enabledNow: flags.filter((f) => f.enabled).length,
    avgRollout: flags.length === 0 ? 0 : Math.round(flags.reduce((acc, f) => acc + (f.enabled ? f.rollout : 0), 0) / Math.max(1, flags.filter((f) => f.enabled).length)),
  }), [flags]);

  return (
    <PageShell>
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6', className)}>
      {/* Header / Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatChip label="Total Flags" value={stats.total} icon={Code} />
        <StatChip label="Live" value={stats.live} icon={Check} accent="emerald" />
        <StatChip label="Beta" value={stats.beta} icon={Sparkles} accent="blue" />
        <StatChip label="Alpha" value={stats.alpha} icon={AlertTriangle} accent="amber" />
        <StatChip label="Avg Rollout" value={`${stats.avgRollout}%`} icon={Zap} accent="primary" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flags..."
              className="pl-9 pr-4 py-2 rounded-xl bg-zinc-900/10 border border-zinc-700/30 text-[11px] text-zinc-300 focus:outline-none focus:border-primary/40 transition-all w-64"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
            {(['all', 'live', 'beta', 'alpha', 'deprecated', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all',
                  filter === s
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlags(loadFlags)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all"
            title="Re-seed from defaults"
          >
            <RefreshCw size={11} />
            Reset
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={11} />
            New Flag
          </button>
        </div>
      </div>

      {/* Storage note */}
      <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2 text-[11px] text-amber-200/80">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        Flags are live and apply instantly across the app via <code className="font-mono text-[10px]">useFeatureFlag()</code>. Toggle any flag to see immediate changes in gated features.
      </div>

      {/* Flag grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((flag) => {
            const Cat = CATEGORY_ICONS[flag.category];
            const status = STATUS_COLORS[flag.status];
            const isEditing = editing === flag.id;
            return (
              <motion.div
                key={flag.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'p-5 rounded-2xl border backdrop-blur-sm transition-all group',
                  isEditing ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-zinc-700/30 bg-zinc-900/10 hover:border-zinc-700/50',
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900/40 border border-zinc-700/30 flex items-center justify-center shrink-0">
                      <Cat size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-[12px] font-black text-white truncate">{flag.name}</h4>
                        <span className={cn('text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md border', status.bg, status.text)}>
                          {flag.status}
                        </span>
                      </div>
                      <code className="text-[9px] font-mono text-zinc-500">{flag.key}</code>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{flag.description}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => updateFlag(flag.id, { enabled: !flag.enabled })}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                      flag.enabled ? 'bg-primary' : 'bg-zinc-700',
                    )}
                    aria-label={flag.enabled ? 'Disable flag' : 'Enable flag'}
                  >
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                      className={cn('inline-block h-3 w-3 rounded-full bg-zinc-950', flag.enabled ? 'translate-x-5' : 'translate-x-1')}
                    />
                  </button>
                </div>

                {/* Notes */}
                {flag.notes && (
                  <div className="p-2.5 mb-3 rounded-lg bg-zinc-950/40 border border-zinc-700/20 text-[10px] text-zinc-500 leading-relaxed">
                    <span className="text-primary font-bold mr-1">NOTE:</span>
                    {flag.notes}
                  </div>
                )}

                {/* Controls (always visible for enabled flags) */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {/* Rollout */}
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] font-bold">
                      <span className="text-zinc-500">Rollout</span>
                      <span className={cn(flag.enabled ? 'text-primary' : 'text-zinc-700')}>{flag.rollout}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={flag.rollout}
                      onChange={(e) => updateFlag(flag.id, { rollout: Number(e.target.value) })}
                      disabled={!flag.enabled}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${flag.rollout}%, #3f3f46 ${flag.rollout}%, #3f3f46 100%)`,
                      }}
                    />
                  </div>

                  {/* Audience */}
                  <div className="space-y-1">
                    <span className="block text-[9px] uppercase tracking-[0.15em] font-bold text-zinc-500">Audience</span>
                    <select
                      value={flag.audience}
                      onChange={(e) => updateFlag(flag.id, { audience: e.target.value as FlagAudience })}
                      className="w-full px-2 py-1 rounded-md bg-zinc-900/40 border border-zinc-700/30 text-[10px] text-zinc-300 focus:outline-none focus:border-primary/40"
                    >
                      <option value="all">All users</option>
                      <option value="pro">Pro only</option>
                      <option value="teacher">Teachers</option>
                      <option value="student">Students</option>
                      <option value="admin">Admins</option>
                      <option value="ceo">CEO / Owner</option>
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-700/20">
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
                    <span>{flag.owner}</span>
                    <span>·</span>
                    <span>{timeAgo(flag.lastModified)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(isEditing ? null : flag.id)}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all"
                      title="Edit"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteFlag(flag.id)}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/40 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="lg:col-span-2 py-16 text-center">
            <p className="text-[10px] text-zinc-500 italic">No flags match your filters.</p>
          </div>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <NewFlagModal
            onClose={() => setShowAdd(false)}
            onCreate={addFlag}
          />
        )}
      </AnimatePresence>
      </div>
    </PageShell>
  );
};

const StatChip: React.FC<{
  label: string;
  value: number | string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: 'emerald' | 'blue' | 'amber' | 'primary';
}> = ({ label, value, icon: Icon, accent }) => {
  const accentClass = accent === 'emerald' ? 'text-emerald-400'
    : accent === 'blue' ? 'text-blue-400'
    : accent === 'amber' ? 'text-amber-400'
    : accent === 'primary' ? 'text-primary'
    : 'text-zinc-500';
  return (
    <div className="p-3 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon size={14} className={accentClass} />
        <div className="min-w-0">
          <p className="text-base font-black text-white leading-none">{value}</p>
          <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
};

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const NewFlagModal: React.FC<{ onClose: () => void; onCreate: (f: FeatureFlag) => void }> = ({ onClose, onCreate }) => {
  const [draft, setDraft] = useState<Omit<FeatureFlag, 'id' | 'lastModified'>>({
    key: '',
    name: '',
    description: '',
    category: 'experimental',
    status: 'draft',
    enabled: false,
    rollout: 0,
    audience: 'all',
    owner: 'Admin',
  });

  const slug = draft.key.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  const valid = slug.length > 0 && draft.name.length > 0;

  const submit = () => {
    if (!valid) return;
    onCreate({
      ...draft,
      id: `flag-${Date.now().toString(36)}`,
      key: slug,
      lastModified: Date.now(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-700/30 rounded-2xl p-6 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
            <Plus size={14} className="text-primary" />
            New Feature Flag
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Display name">
            <input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="AI Voice Mode"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[12px] text-zinc-100 focus:outline-none focus:border-primary/40"
            />
          </Field>
          <Field label="Key (used in code)">
            <input
              value={draft.key}
              onChange={(e) => setDraft((p) => ({ ...p, key: e.target.value }))}
              placeholder="ai_voice_mode"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[12px] text-zinc-100 font-mono focus:outline-none focus:border-primary/40"
            />
            {slug && slug !== draft.key && (
              <div className="text-[9px] text-zinc-500 font-mono mt-1">→ {slug}</div>
            )}
          </Field>
          <Field label="Description">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="What this flag enables..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[11px] text-zinc-300 focus:outline-none focus:border-primary/40 resize-none"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Category">
              <select
                value={draft.category}
                onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as FeatureFlag['category'] }))}
                className="w-full px-2 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[11px] text-zinc-300"
              >
                <option value="ai">AI</option>
                <option value="study">Study</option>
                <option value="integrations">Integrations</option>
                <option value="social">Social</option>
                <option value="experimental">Experimental</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={draft.status}
                onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as FlagStatus }))}
                className="w-full px-2 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[11px] text-zinc-300"
              >
                <option value="draft">Draft</option>
                <option value="alpha">Alpha</option>
                <option value="beta">Beta</option>
                <option value="live">Live</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={draft.audience}
                onChange={(e) => setDraft((p) => ({ ...p, audience: e.target.value as FlagAudience }))}
                className="w-full px-2 py-2 rounded-lg bg-zinc-900/40 border border-zinc-700/30 text-[11px] text-zinc-300"
              >
                <option value="all">All</option>
                <option value="pro">Pro</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
                <option value="ceo">CEO / Owner</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-700/30">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-zinc-900/40 text-zinc-300 text-[11px] font-bold hover:bg-zinc-900/60 transition-all">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.1em] hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Save size={12} />
            Create Flag
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[9px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-1.5">{label}</label>
    {children}
  </div>
);

export default AdminFeatureFlags;
