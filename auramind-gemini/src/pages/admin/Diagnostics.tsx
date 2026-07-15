import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  GlobeIcon as Globe,
  CpuIcon as Cpu,
  LockIcon as Lock,
  DatabaseIcon as Database2,
  CodeIcon as Code,
  CopyIcon as Copy,
  CheckCircleIcon as CheckCircle,
  AlertTriangleIcon as AlertTriangle,
  XCircleIcon as XCircle,
  InfoIcon as Info,
  RefreshCwIcon as RefreshCw,
  DownloadIcon as Download,
  ClockIcon as Clock,
  PlayIcon as Play,
} from '../../components/icons/CustomIcons';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip' | 'pending';

interface DiagnosticResult {
  id: string;
  name: string;
  /** Optional: undefined until the check has run for the first time. */
  status?: CheckStatus;
  /** Short human-readable value (e.g. "v2.4.1", "120ms", "\u2713") */
  value?: string;
  /** Latency in ms for network calls. */
  latency?: number;
  /** Short description next to the name. */
  detail?: string;
  /** Full, uncollapsed error message \u2014 render verbatim when present. */
  error?: string;
  /** ISO timestamp when the check ran. */
  ranAt?: string;
}

interface DiagnosticsSection {
  id: 'build' | 'env' | 'network' | 'storage' | 'auth' | 'api';
  title: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent: string;
  results: DiagnosticResult[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Initial sections — every result starts as `pending` until its check runs
// ──────────────────────────────────────────────────────────────────────────────

const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '0.0.0-dev';
const BUILD_COMMIT = (import.meta as any).env?.VITE_GIT_COMMIT || 'unknown';
const BUILD_TIME = (import.meta as any).env?.VITE_BUILD_TIME || 'unknown';

const INITIAL_SECTIONS: DiagnosticsSection[] = [
  {
    id: 'build',
    title: 'Build & Version',
    description: 'Compiled artifact metadata, environment mode, and deployment region',
    icon: Code,
    accent: '#a855f7',
    results: [
      { id: 'b:version',    name: 'App version',  detail: 'Compiled package version', status: 'pending' as CheckStatus },
      { id: 'b:commit',     name: 'Git commit',   detail: 'Source revision the bundle was built from', status: 'pending' as CheckStatus },
      { id: 'b:buildtime',  name: 'Build time',   detail: 'Wall-clock timestamp of compilation', status: 'pending' as CheckStatus },
      { id: 'b:mode',       name: 'Environment mode', detail: 'dev / production / preview', status: 'pending' as CheckStatus },
      { id: 'b:origin',     name: 'Origin',       detail: 'window.location.origin', status: 'pending' as CheckStatus },
      { id: 'b:useragent',  name: 'User agent',   detail: 'navigator.userAgent', status: 'pending' as CheckStatus },
      { id: 'b:viewport',   name: 'Viewport',     detail: 'innerWidth × innerHeight', status: 'pending' as CheckStatus },
    ],
  },
  {
    id: 'env',
    title: 'Environment Variables',
    description: 'Critical env vars at build time — vite injects anything prefixed VITE_',
    icon: Code,
    accent: '#06b6d4',
    results: [
      { id: 'e:api',        name: 'VITE_API_BASE_URL',         detail: 'Backend API origin', status: 'pending' as CheckStatus },
      { id: 'e:supabase',   name: 'VITE_SUPABASE_URL',        detail: 'Supabase project URL', status: 'pending' as CheckStatus },
      { id: 'e:supakey',    name: 'VITE_SUPABASE_ANON_KEY',    detail: 'Supabase anon key (safe to ship)', status: 'pending' as CheckStatus },
      { id: 'e:groq',       name: 'VITE_GROQ_API_KEY',         detail: 'Groq inference key', status: 'pending' as CheckStatus },
      { id: 'e:stripe',     name: 'VITE_STRIPE_PUBLISHABLE_KEY', detail: 'Stripe publishable key', status: 'pending' as CheckStatus },
      { id: 'e:posthog',    name: 'VITE_POSTHOG_KEY',          detail: 'PostHog analytics key', status: 'pending' as CheckStatus },
    ],
  },
  {
    id: 'network',
    title: 'Network & Device',
    description: 'Connectivity, effective connection type, hardware specs',
    icon: Globe,
    accent: '#10b981',
    results: [
      { id: 'n:online',     name: 'Browser online',         detail: 'navigator.onLine', status: 'pending' as CheckStatus },
      { id: 'n:conntype',   name: 'Effective connection',   detail: 'Network Information API', status: 'pending' as CheckStatus },
      { id: 'n:rtt',        name: 'Round-trip time',       detail: 'Estimated RTT when available', status: 'pending' as CheckStatus },
      { id: 'n:downlink',   name: 'Downlink estimate',     detail: 'Mbps, when available', status: 'pending' as CheckStatus },
      { id: 'n:cores',      name: 'CPU cores',             detail: 'navigator.hardwareConcurrency', status: 'pending' as CheckStatus },
      { id: 'n:memory',     name: 'Device memory',         detail: 'navigator.deviceMemory (GB)', status: 'pending' as CheckStatus },
    ],
  },
  {
    id: 'storage',
    title: 'Storage & Persistence',
    description: 'Local storage and session storage write/read/erase round-trip',
    icon: Database2,
    accent: '#f59e0b',
    results: [
      { id: 's:local',      name: 'localStorage',         detail: 'Round-trip write → read → erase', status: 'pending' as CheckStatus },
      { id: 's:session',    name: 'sessionStorage',       detail: 'Round-trip write → read → erase', status: 'pending' as CheckStatus },
      { id: 's:cookies',    name: 'Cookies enabled',      detail: 'navigator.cookieEnabled', status: 'pending' as CheckStatus },
    ],
  },
  {
    id: 'auth',
    title: 'Auth & Session',
    description: 'Supabase session validity, role flags, and access token shape',
    icon: Lock,
    accent: '#ec4899',
    results: [
      { id: 'a:hasSession', name: 'Session present',      detail: 'supabase.auth.getSession()', status: 'pending' as CheckStatus },
      { id: 'a:hasUser',    name: 'User present',         detail: 'session.user', status: 'pending' as CheckStatus },
      { id: 'a:hasToken',   name: 'Access token',         detail: 'JWT in session.access_token', status: 'pending' as CheckStatus },
      { id: 'a:exp',        name: 'Token expiry',         detail: 'session.expires_at (epoch seconds)', status: 'pending' as CheckStatus },
      { id: 'a:role',       name: 'Admin claim',          detail: 'user.user_metadata.is_admin / ADMIN_EMAIL match', status: 'pending' as CheckStatus },
      { id: 'a:email',      name: 'User email',           detail: 'session.user.email', status: 'pending' as CheckStatus },
    ],
  },
  {
    id: 'api',
    title: 'API & Integrations',
    description: 'Live probes of the backend, Supabase, Stripe, Resend, AI, and admin endpoints',
    icon: Cpu,
    accent: '#3b82f6',
    results: [
      { id: 'ap:health',    name: 'GET /api/health',                       detail: 'Server liveness', status: 'pending' as CheckStatus },
      { id: 'ap:supabase',  name: 'Supabase',                              detail: '/api/admin/test result', status: 'pending' as CheckStatus },
      { id: 'ap:stripe',    name: 'Stripe API',                            detail: '/api/admin/test result', status: 'pending' as CheckStatus },
      { id: 'ap:resend',    name: 'Resend Email',                          detail: '/api/admin/test result', status: 'pending' as CheckStatus },
      { id: 'ap:list',      name: 'GET /api/admin/list',                   detail: 'User listing (admin route)', status: 'pending' as CheckStatus },
      { id: 'ap:test',      name: 'GET /api/admin/test',                   detail: 'Aggregate integration test', status: 'pending' as CheckStatus },
      { id: 'ap:revenue',   name: 'GET /api/admin/revenue',                detail: 'Stripe revenue metrics', status: 'pending' as CheckStatus },
      { id: 'ap:audit',     name: 'POST /api/admin/audit (action=list)',   detail: 'Audit log read', status: 'pending' as CheckStatus },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const statusStyles: Record<CheckStatus, { dot: string; ring: string; chip: string; label: string }> = {
  pass:    { dot: 'bg-emerald-400',  ring: 'shadow-[0_0_12px_rgba(52,211,153,0.55)]',  chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',           label: 'PASS' },
  warn:    { dot: 'bg-amber-400',    ring: 'shadow-[0_0_12px_rgba(251,191,36,0.55)]',  chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',               label: 'WARN' },
  fail:    { dot: 'bg-rose-400',     ring: 'shadow-[0_0_12px_rgba(251,113,133,0.6)]',  chip: 'bg-rose-500/10 text-rose-300 border-rose-500/30',                   label: 'FAIL' },
  skip:    { dot: 'bg-zinc-500',     ring: '',                                       chip: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/30',                 label: 'SKIP' },
  pending: { dot: 'bg-zinc-700 animate-pulse', ring: '',                            chip: 'bg-zinc-800/40 text-zinc-500 border-zinc-700/30',                 label: '...'},
};

const STATUS_RANK: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2, skip: 3, pending: 4 };

async function copyToClipboard(text: string): Promise<{ ok: boolean; reason?: string }> {
  // Method 1: copy event + execCommand (synchronous, captures user gesture).
  // The copy event lets us inject custom data into the system clipboard
  // directly, bypassing permissions issues that plague the async Clipboard API.
  try {
    let copied = false;
    const handler = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/plain', text);
      e.preventDefault();
      copied = true;
    };
    document.addEventListener('copy', handler);
    document.execCommand('copy');
    document.removeEventListener('copy', handler);
    if (copied) return { ok: true };
  } catch { /* fall through */ }

  // Method 2: Modern Clipboard API (may need secure context + permission)
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: String(err?.message || err || 'clipboard write failed') };
  }
}

// Latency wrapper — times an async op and returns { latencyMs, result }
async function timed<T>(fn: () => Promise<T>): Promise<{ latencyMs: number; result?: T; error?: Error }> {
  const t0 = performance.now();
  try {
    const result = await fn();
    return { latencyMs: Math.round(performance.now() - t0), result };
  } catch (err: any) {
    return { latencyMs: Math.round(performance.now() - t0), error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

interface DiagnosticsProps {
  className?: string;
}

const Diagnostics: React.FC<DiagnosticsProps> = ({ className }) => {
  const [sections, setSections] = useState<DiagnosticsSection[]>(INITIAL_SECTIONS);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  // When the automatic clipboard write is blocked (permissions-policy,
  // non-secure context, execCommand returning false, sandboxed iframe
  // without clipboard-write grant) we surface the failure to the user via
  // a modal so they can Ctrl+C the same text from a focused textarea.
  const [manualCopy, setManualCopy] = useState<{ text: string; title: string; reason?: string } | null>(null);

  const runStarted = useRef(false);

  // Update single result (immutably, by section + result id).
  const updateResult = useCallback(
    (sectionId: DiagnosticsSection['id'], resultId: string, patch: Partial<DiagnosticResult>) => {
      setSections((prev) =>
        prev.map((s) =>
          s.id !== sectionId
            ? s
            : { ...s, results: s.results.map((r) => (r.id === resultId ? { ...r, ...patch, ranAt: new Date().toISOString() } : r)) }
        )
      );
    },
    []
  );

  // ─────────────── Checks ───────────────

  const runBuildChecks = useCallback(async () => {
    updateResult('build', 'b:version', {
      status: 'pass', value: APP_VERSION,
      detail: `Compiled package version (VITE_APP_VERSION=${APP_VERSION})`,
      latency: 0,
    });
    updateResult('build', 'b:commit', {
      status: BUILD_COMMIT === 'unknown' ? 'warn' : 'pass',
      value: BUILD_COMMIT,
      detail: BUILD_COMMIT === 'unknown'
        ? 'VITE_GIT_COMMIT not defined at build — set it in CI for traceability'
        : 'Source revision this bundle was built from',
    });
    updateResult('build', 'b:buildtime', {
      status: BUILD_TIME === 'unknown' ? 'warn' : 'pass',
      value: BUILD_TIME,
      detail: BUILD_TIME === 'unknown'
        ? 'VITE_BUILD_TIME not defined — bundle lacks compile-time stamp'
        : 'Wall-clock timestamp of compilation',
    });
    const isProd = import.meta.env.PROD;
    updateResult('build', 'b:mode', {
      status: isProd ? 'pass' : 'warn',
      value: isProd ? 'production' : (import.meta.env.MODE || 'development'),
      detail: isProd ? 'PRODUCTION bundle' : 'Non-prod build — check before shipping',
    });
    if (typeof window !== 'undefined') {
      updateResult('build', 'b:origin', { status: 'pass', value: window.location.origin });
      updateResult('build', 'b:useragent', { status: 'pass', value: navigator.userAgent || '' });
      updateResult('build', 'b:viewport', {
        status: 'pass', value: `${window.innerWidth}×${window.innerHeight}`,
      });
    }
  }, [updateResult]);

  const runEnvChecks = useCallback(async () => {
    const env: any = (import.meta as any).env || {};
    const vars: Array<[string, string]> = [
      ['e:api',     'VITE_API_BASE_URL'],
      ['e:supabase','VITE_SUPABASE_URL'],
      ['e:supakey', 'VITE_SUPABASE_ANON_KEY'],
      ['e:groq',    'VITE_GROQ_API_KEY'],
      ['e:stripe',  'VITE_STRIPE_PUBLISHABLE_KEY'],
      ['e:posthog', 'VITE_POSTHOG_KEY'],
    ];
    for (const [id, key] of vars) {
      const present = Boolean(env[key]) && env[key] !== 'undefined' && env[key] !== '';
      updateResult('env', id, {
        status: present ? 'pass' : 'fail',
        value: present ? maskSecret(env[key]) : '(missing)',
        detail: present ? `${key} is set` : `${key} not defined at build time — feature depending on it will fail`,
        error: present ? undefined : `${key} missing. Add to .env / vercel env / vite define plugin.`,
      });
    }
  }, [updateResult]);

  const runNetworkChecks = useCallback(async () => {
    const nav: any = navigator as any;
    updateResult('network', 'n:online', {
      status: nav.onLine ? 'pass' : 'fail',
      value: nav.onLine ? 'online' : 'offline',
      error: nav.onLine ? undefined : 'Browser reports it is offline. Requests will fail.',
    });
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      updateResult('network', 'n:conntype', {
        status: 'pass', value: conn.effectiveType || 'unknown',
        detail: `${conn.type || 'n/a'} · saveData=${String(Boolean(conn.saveData))}`,
      });
      updateResult('network', 'n:rtt', {
        status: 'pass', value: conn.rtt != null ? `${conn.rtt}ms` : 'unavailable',
      });
      updateResult('network', 'n:downlink', {
        status: 'pass', value: conn.downlink != null ? `${conn.downlink} Mbps` : 'unavailable',
      });
    } else {
      updateResult('network', 'n:conntype', { status: 'warn', value: 'unavailable', detail: 'Network Information API not present in this browser' });
      updateResult('network', 'n:rtt',      { status: 'warn', value: 'unavailable' });
      updateResult('network', 'n:downlink', { status: 'warn', value: 'unavailable' });
    }
    updateResult('network', 'n:cores',  { status: 'pass', value: String(nav.hardwareConcurrency || 'unknown') });
    updateResult('network', 'n:memory', {
      status: 'pass',
      value: nav.deviceMemory != null ? `${nav.deviceMemory} GB` : 'unavailable',
      detail: nav.deviceMemory != null ? undefined : 'deviceMemory not reported in this browser',
    });
  }, [updateResult]);

  const runStorageChecks = useCallback(async () => {
    // localStorage round-trip
    try {
      const k = '__auramind_diag__';
      const v = String(Date.now());
      window.localStorage.setItem(k, v);
      const back = window.localStorage.getItem(k);
      window.localStorage.removeItem(k);
      if (back !== v) throw new Error('read-back mismatch');
      updateResult('storage', 's:local', { status: 'pass', value: 'write + read + erase' });
    } catch (err: any) {
      updateResult('storage', 's:local', {
        status: 'fail',
        value: 'unusable',
        error: err?.message || 'localStorage inaccessible (private mode / quota)',
      });
    }
    try {
      const k = '__auramind_diag_session__';
      const v = String(Date.now());
      window.sessionStorage.setItem(k, v);
      const back = window.sessionStorage.getItem(k);
      window.sessionStorage.removeItem(k);
      if (back !== v) throw new Error('read-back mismatch');
      updateResult('storage', 's:session', { status: 'pass', value: 'write + read + erase' });
    } catch (err: any) {
      updateResult('storage', 's:session', {
        status: 'fail',
        value: 'unusable',
        error: err?.message || 'sessionStorage inaccessible',
      });
    }
    updateResult('storage', 's:cookies', {
      status: navigator.cookieEnabled ? 'pass' : 'fail',
      value: navigator.cookieEnabled ? 'enabled' : 'disabled',
      error: navigator.cookieEnabled ? undefined : 'Cookies are disabled — Supabase session will not persist.',
    });
  }, [updateResult]);

  const runAuthChecks = useCallback(async () => {
    let session: any = null;
    try {
      const { supabase } = await import('../../services/database/supabase');
      const res = await supabase?.auth?.getSession?.();
      session = res?.data?.session ?? null;
    } catch (err: any) {
      updateResult('auth', 'a:hasSession', {
        status: 'fail', value: 'error', error: err?.message ?? String(err),
      });
    }
    if (!session) {
      updateResult('auth', 'a:hasSession', { status: 'fail', value: 'no session', error: 'No active Supabase session — admin routes will return 401' });
      updateResult('auth', 'a:hasUser',    { status: 'skip', value: '—', detail: 'No session to inspect' });
      updateResult('auth', 'a:hasToken',   { status: 'skip', value: '—' });
      updateResult('auth', 'a:exp',        { status: 'skip', value: '—' });
      updateResult('auth', 'a:role',       { status: 'skip', value: '—' });
      updateResult('auth', 'a:email',      { status: 'skip', value: '—' });
      return;
    }
    updateResult('auth', 'a:hasSession', { status: 'pass', value: 'session present' });
    const user = session.user;
    updateResult('auth', 'a:hasUser', {
      status: user ? 'pass' : 'fail',
      value: user ? user.id || 'present' : 'missing',
    });
    const token = session.access_token;
    updateResult('auth', 'a:hasToken', {
      status: token ? 'pass' : 'fail',
      value: token ? `${token.length} chars` : 'missing',
      error: token ? undefined : 'No access_token on session',
    });
    const exp = session.expires_at;
    const expIso = exp ? new Date(exp * 1000).toISOString() : '—';
    const expValid = exp ? exp * 1000 > Date.now() : false;
    updateResult('auth', 'a:exp', {
      status: !exp ? 'warn' : expValid ? 'pass' : 'fail',
      value: expIso,
      detail: exp ? (expValid ? `expires in ${Math.round((exp * 1000 - Date.now()) / 60000)} min` : 'EXPIRED — refresh required') : 'expires_at missing',
      error: exp && !expValid ? 'Access token is expired. Reload page or call supabase.auth.refreshSession().' : undefined,
    });
    const isAdminMeta = user?.user_metadata?.is_admin;
    const isAdminEmail = user?.email === 'matty.cigemp@gmail.com';
    const isAdminUser = isAdminMeta || isAdminEmail;
    updateResult('auth', 'a:role', {
      status: isAdminUser ? 'pass' : 'warn',
      value: isAdminMeta ? 'admin' : (isAdminEmail ? 'admin (via email)' : (user?.user_metadata?.role ?? 'user')),
      detail: isAdminUser ? `Admin access granted` : 'User has is_admin=false — admin endpoints will reject',
      error: isAdminUser ? undefined : 'Log in as the configured ADMIN_EMAIL or grant is_admin in user_metadata.',
    });
    updateResult('auth', 'a:email', {
      status: user?.email ? 'pass' : 'warn',
      value: user?.email || '(no email on session)',
    });
  }, [updateResult]);

  const runApiChecks = useCallback(async () => {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || '';

    // 1. /api/health
    {
      const { latencyMs, error } = await timed(() => fetch(`${base}/api/health`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }));
      updateResult('api', 'ap:health', {
        status: error ? 'fail' : 'pass',
        value: error ? `failed after ${latencyMs}ms` : `OK ${latencyMs}ms`,
        latency: latencyMs,
        error: error?.message,
      });
    }

    // Need session token for admin routes
    let token: string | null = null;
    try {
      const { supabase } = await import('../../services/database/supabase');
      const res = await supabase?.auth?.getSession?.();
      token = res?.data?.session?.access_token ?? null;
    } catch { /* will fall through */ }
    if (!token) {
      ['ap:supabase','ap:stripe','ap:resend','ap:list','ap:test','ap:revenue','ap:audit'].forEach((id) => {
        updateResult('api', id, { status: 'skip', value: '—', detail: 'No access token — skipped admin probe' });
      });
      return;
    }
    // POST body for ap:audit. The shared handleAuditList helper parses
    // `action: 'list'` from the body and forwards to its own validator;
    // without action the request 400s even when the route is healthy.
    const adminOpts: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'list', limit: 1, offset: 0 }),
    };

    // Admin IDs that depend on a valid session token. If the first admin
    // probe (ap:test) returns 401, we short-circuit the remaining ones
    // instead of letting them all 401 individually (which would render as
    // 7 redundant red rows on a routine expired-token state).
    const downstreamAdminIds = ['ap:list', 'ap:revenue', 'ap:audit'];
    let adminAuthFailed = false;

    // 2. /api/admin/test — primary admin probe; also serves as the auth gate
    let adminTest: any = null;
    {
      const { latencyMs, result, error } = await timed(() =>
        fetch(`${base}/api/admin/test`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
          // Stamp the HTTP status onto the thrown Error so the auth gate
          // below can detect a 401 vs a generic 500 without juggling the
          // Status object across the timed() wrapper.
          if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
          return r.json();
        })
      );
      if (error) {
        const isAuth = (error as any).status === 401 || /401|unauthor/i.test(error.message);
        if (isAuth) {
          adminAuthFailed = true;
          [ 'ap:test', 'ap:supabase', 'ap:stripe', 'ap:resend', ...downstreamAdminIds ].forEach((id) => {
            updateResult('api', id, {
              status: 'skip',
              value: 'Auth required',
              detail: 'Re-run after refreshing the Supabase session.',
              latency: latencyMs,
              error: error.message,
            });
          });
        } else {
          // Non-auth failure (network, 500, etc.) — still mark the
          // aggregate probe fail, but keep downstream probes so we don't
          // hide endpoint-specific problems behind a generic auth gate.
          [ 'ap:supabase', 'ap:stripe', 'ap:resend', 'ap:test' ].forEach((id) => {
            updateResult('api', id, { status: 'fail', value: `failed`, latency: latencyMs, error: error.message });
          });
        }
      } else {
        adminTest = result;
        updateResult('api', 'ap:test', { status: 'pass', value: `aggregate ok ${latencyMs}ms`, latency: latencyMs });
        const map: Array<[string, string]> = [
          ['ap:supabase', 'Supabase'],
          ['ap:stripe',   'Stripe'],
          ['ap:resend',   'Resend'],
        ];
        for (const [id, name] of map) {
          const sub = adminTest?.data?.tests?.find?.((t: any) => typeof t?.name === 'string' && t.name.startsWith(name));
          if (!sub) {
            updateResult('api', id, { status: 'warn', value: 'unknown', detail: 'Not reported by server' });
          } else {
            updateResult('api', id, {
              status: sub.status === 'passed' ? 'pass' : sub.status === 'failed' ? 'fail' : 'warn',
              value: sub.status,
              detail: sub.message,
              error: sub.status === 'failed' ? sub.message : undefined,
            });
          }
        }
      }
    }

    // 3-5. Downstream admin probes — skipped wholesale if ap:test 401'd.
    if (adminAuthFailed) return;

    // 3. /api/admin/list
    {
      const { latencyMs, result, error } = await timed(() =>
        fetch(`${base}/api/admin/list`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      );
      if (error) {
        updateResult('api', 'ap:list', { status: 'fail', value: 'failed', latency: latencyMs, error: error.message });
      } else {
        updateResult('api', 'ap:list', {
          status: 'pass',
          value: `${(result?.data?.users ?? []).length} users`,
          latency: latencyMs,
        });
      }
    }

    // 4. /api/admin/revenue
    {
      const { latencyMs, error } = await timed(() =>
        fetch(`${base}/api/admin/revenue`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      );
      updateResult('api', 'ap:revenue', {
        status: error ? 'fail' : 'pass',
        value: error ? 'failed' : `ok ${latencyMs}ms`,
        latency: latencyMs,
        error: error?.message,
      });
    }

    // 5. /api/admin/audit (action=list) — uses adminOpts built above.
    {
      const { latencyMs, error } = await timed(() =>
        fetch(`${base}/api/admin/audit`, adminOpts).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      );
      updateResult('api', 'ap:audit', {
        status: error ? 'fail' : 'pass',
        value: error ? 'failed' : `ok ${latencyMs}ms`,
        latency: latencyMs,
        error: error?.message,
      });
    }
  }, [updateResult]);

  // ─────────────── Run orchestrator ───────────────

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStartedAt(Date.now());
    setCompletedAt(null);

    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        results: s.results.map((r) => ({ ...r, status: 'pending', error: undefined, value: undefined, latency: undefined })),
      }))
    );

    // Sections ordered by cheap→expensive so the user sees early feedback fast
    try {
      await runBuildChecks();
      await runEnvChecks();
      await runNetworkChecks();
      await runStorageChecks();
      await runAuthChecks();
      await runApiChecks();
    } finally {
      setRunning(false);
      setCompletedAt(Date.now());
    }
  }, [running, runBuildChecks, runEnvChecks, runNetworkChecks, runStorageChecks, runAuthChecks, runApiChecks]);

  useEffect(() => {
    if (runStarted.current) return;
    runStarted.current = true;
    // Auto-run once on mount. Skipping on the server is irrelevant — this
    // component only renders client-side via React.lazy in App.tsx.
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes the manual-copy fallback modal.
  useEffect(() => {
    if (!manualCopy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setManualCopy(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [manualCopy]);

  // ─────────────── Derived: summary counts ───────────────

  const summary = useMemo(() => {
    const counts = { pass: 0, warn: 0, fail: 0, skip: 0, pending: 0 } as Record<CheckStatus, number>;
    sections.forEach((s) => s.results.forEach((r) => { if (r.status) counts[r.status] += 1; }));
    const total = sections.reduce((acc, s) => acc + s.results.length, 0);
    return { ...counts, total };
  }, [sections]);

  // Gate the tone on "all complete" first: while any row is still pending,
  // we shouldn't claim pass/warn/fail because the sweep hasn't finished.
  // Without this guard every fresh mount would briefly render "All checks
  // passing" between INITIAL_SECTIONS (all status='pending') and run()'s
  // first update() call, which is misleading.
  const overallTone: 'pending' | 'fail' | 'warn' | 'pass' =
    summary.pending > 0
      ? 'pending'
      : summary.fail > 0
        ? 'fail'
        : summary.warn > 0
          ? 'warn'
          : 'pass';

  const elapsedMs = completedAt && startedAt ? completedAt - startedAt : null;

  // ─────────────── Copy full report ───────────────

  const fullReport = useMemo(() => {
    const lines: string[] = [];
    lines.push(`# AuraMind Diagnostics Report`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`URL: ${typeof window !== 'undefined' ? window.location.origin : 'server'}`);
    lines.push(`App version: ${APP_VERSION} · commit ${BUILD_COMMIT} · mode ${import.meta.env.MODE}`);
    lines.push(`Outcome: ${overallTone.toUpperCase()} — pass=${summary.pass} warn=${summary.warn} fail=${summary.fail} skip=${summary.skip} pending=${summary.pending}`);
    if (elapsedMs != null) lines.push(`Run time: ${elapsedMs}ms`);
    lines.push('');
    for (const sec of sections) {
      lines.push(`## ${sec.title}`);
      const ordered = [...sec.results].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
      for (const r of ordered) {
        // Belt-and-braces guard: every INITIAL_SECTIONS row starts with
        // status: 'pending' and run() keeps that contract, but if a future
        // record ever lands here with status undefined the report falls
        // back to PENDING rather than crashing the page.
        lines.push(`- [${(r.status ?? 'pending').toUpperCase()}] ${r.name}` + (r.value ? ` — ${r.value}` : '') + (r.latency != null ? ` (${r.latency}ms)` : ''));
        if (r.detail) lines.push(`    ${r.detail}`);
        if (r.error) lines.push(`    ERROR: ${r.error}`);
        if (r.ranAt)  lines.push(`    ran_at: ${r.ranAt}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }, [sections, summary, overallTone, elapsedMs]);

  const handleCopyFull = useCallback(async () => {
    const result = await copyToClipboard(fullReport);
    if (result.ok) {
      setCopiedFull(true);
      setManualCopy(null);
      window.setTimeout(() => setCopiedFull(false), 1800);
    } else {
      // Don't lie about success — open the manual-copy modal so the user
      // can grab the same text via Ctrl+C instead.
      setCopiedFull(false);
      setManualCopy({
        text: fullReport,
        title: 'Manual copy — full diagnostics report',
        reason: result.reason,
      });
    }
  }, [fullReport]);

  const handleCopyRow = useCallback(async (r: DiagnosticResult, sec: DiagnosticsSection) => {
    const text = [
      `# ${sec.title} / ${r.name}`,
      // Belt-and-braces: r.status is now always 'pending' on first render
      // (earlier fix) but the row type still allows undefined for any code
      // path that adds a record without setting it.
      `Status: ${(r.status ?? 'pending').toUpperCase()}${r.value ? ` (${r.value})` : ''}`,
      r.detail ? `Detail: ${r.detail}` : '',
      r.error ? `Error: ${r.error}` : '',
      r.latency != null ? `Latency: ${r.latency}ms` : '',
      r.ranAt ? `Ran at: ${r.ranAt}` : '',
    ].filter(Boolean).join('\n');
    const result = await copyToClipboard(text);
    if (result.ok) {
      setCopiedRowId(r.id);
      setManualCopy(null);
      window.setTimeout(() => setCopiedRowId((c) => (c === r.id ? null : c)), 1800);
    } else {
      setManualCopy({
        text,
        title: `Manual copy — ${sec.title} / ${r.name}`,
        reason: result.reason,
      });
    }
  }, []);

  // ─────────────── Render ───────────────

  return (
    <div className={cn('space-y-6 pb-20', className)}>
      {/* ────────── Summary header ────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div
          className={cn(
            'lg:col-span-2 p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden',
            overallTone === 'fail' ? 'border-rose-500/40 bg-rose-500/5'
              : overallTone === 'warn' ? 'border-amber-500/40 bg-amber-500/5'
              : overallTone === 'pending' ? 'border-cyan-500/40 bg-cyan-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
              overallTone === 'fail' ? 'bg-rose-500/15 border border-rose-500/30'
                : overallTone === 'warn' ? 'bg-amber-500/15 border border-amber-500/30'
                : overallTone === 'pending' ? 'bg-cyan-500/15 border border-cyan-500/30'
                : 'bg-emerald-500/15 border border-emerald-500/30'
            )}>
              {overallTone === 'fail' ? <XCircle size={20} className="text-rose-300" />
                : overallTone === 'warn' ? <AlertTriangle size={20} className="text-amber-300" />
                : overallTone === 'pending' ? <RefreshCw size={20} className="text-cyan-300 animate-spin" />
                : <CheckCircle size={20} className="text-emerald-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">System diagnostics</p>
              <h2 className="text-xl font-black text-white">
                {overallTone === 'fail' && 'Issues detected — at least one check failed'}
                {overallTone === 'warn' && 'Warnings present — review and address'}
                {overallTone === 'pending' && 'Running integrity sweep…'}
                {overallTone === 'pass' && 'All checks passing'}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                {summary.fail} failing · {summary.warn} warning · {summary.pass} passing · {summary.skip} skipped
                {summary.pending > 0 ? ` · ${summary.pending} still running` : ''}
                {' '}— across {summary.total - summary.pending} completed checks.
                {elapsedMs != null ? ` Last run took ${elapsedMs}ms.` : ' Running…'}
              </p>

              {summary.fail > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-zinc-950/40 border border-rose-500/20 text-[10px] text-rose-300 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Failing checks: {sections.flatMap((s) => s.results.filter((r) => r.status === 'fail').map((r) => `${s.title} → ${r.name}`)).slice(0, 4).join(' · ')}
                    {summary.fail > 4 ? ` · and ${summary.fail - 4} more` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Actions</p>
            {running ? (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-300">
                <RefreshCw size={11} className="animate-spin" /> running
              </span>
            ) : (
              <span className="text-[9px] text-zinc-500 font-mono">
                {completedAt ? new Date(completedAt).toLocaleTimeString() : 'not run'}
              </span>
            )}
          </div>
          <button
            onClick={run}
            disabled={running}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all',
              running
                ? 'bg-zinc-800/40 text-zinc-500 cursor-wait'
                : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/40'
            )}
          >
            {running ? (
              <><RefreshCw size={13} className="animate-spin" /> Running checks…</>
            ) : (
              <><Play size={13} /> Re-run all checks</>
            )}
          </button>
          <button
            onClick={handleCopyFull}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700/40 bg-zinc-900/30 hover:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-300 hover:text-white transition-all"
          >
            {copiedFull ? <><CheckCircle size={12} className="text-emerald-400" /> Copied</> : <><Download size={12} /> Copy full report</>}
          </button>
        </div>
      </div>

      {/* ────────── Sections — errors NOT collapsed ────────── */}
      {sections.map((sec) => {
        const failedCount = sec.results.filter((r) => r.status === 'fail').length;
        const warnCount = sec.results.filter((r) => r.status === 'warn').length;
        const Icon = sec.icon;
        const sectionTone = failedCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
        return (
          <motion.div
            key={sec.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-6 rounded-2xl border backdrop-blur-sm',
              sectionTone === 'fail' ? 'border-rose-500/30 bg-rose-500/5'
                : sectionTone === 'warn' ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-zinc-700/30 bg-zinc-900/10'
            )}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  background: `${sec.accent}11`,
                  borderColor: `${sec.accent}40`,
                }}
              >
                {/* CustomIcon component only accepts size + className, so wrap
                    it in a span to drive the section accent color via style. */}
                <span style={{ color: sec.accent, display: 'inline-flex' }}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.1em]">{sec.title}</h3>
                  {failedCount > 0 && (
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      {failedCount} failing
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      {warnCount} warn
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">{sec.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {sec.results
                .slice()
                .sort((a, b) => {
                  const aR = a.status ? STATUS_RANK[a.status] : 99;
                  const bR = b.status ? STATUS_RANK[b.status] : 99;
                  return aR - bR;
                })
                .map((r) => (
                  <DiagnosticRow
                    key={r.id}
                    r={r}
                    accent={sec.accent}
                    copied={copiedRowId === r.id}
                    onCopy={() => handleCopyRow(r, sec)}
                  />
                ))}
            </div>
          </motion.div>
        );
      })}

      {/* ────────── Footer ────────── */}
      <div className="text-[9px] text-zinc-600 font-mono text-center">
        Generated {new Date().toISOString()} · version {APP_VERSION} · {summary.total} total checks
      </div>

      {/* ────────── Manual-copy fallback modal ────────── */}
      {/* Renders only when both the Clipboard API and execCommand failed.
          Modal is keyboard-accessible (Escape closes, textarea is focused
          and pre-selected on mount so Ctrl+C / ⌘C copies immediately). */}
      {manualCopy && (
        <ManualCopyModal
          title={manualCopy.title}
          reason={manualCopy.reason}
          text={manualCopy.text}
          onClose={() => setManualCopy(null)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper subcomponent — one DiagnosticRow
// ──────────────────────────────────────────────────────────────────────────────

const DiagnosticRow: React.FC<{
  r: DiagnosticResult;
  accent: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ r, accent, copied, onCopy }) => {
  const styles = statusStyles[r.status];
  const isPending = r.status === 'pending';
  const hasError = Boolean(r.error);

  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        r.status === 'fail' ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
          : r.status === 'warn' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
          : r.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
          : 'bg-zinc-900/10 border-zinc-700/30'
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <span className={cn('w-2 h-2 rounded-full shrink-0', styles.dot, styles.ring)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-bold text-zinc-200">{r.name}</p>
            <span className={cn('text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md border', styles.chip)}>
              {isPending ? '...' : styles.label}
            </span>
            {r.value && (
              <span className="text-[10px] font-mono text-zinc-300 truncate max-w-[260px]" title={r.value}>
                {r.value}
              </span>
            )}
            {r.latency != null && (
              <span className="text-[9px] text-zinc-500 font-mono">{r.latency}ms</span>
            )}
          </div>
          {r.detail && (
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{r.detail}</p>
          )}
        </div>
        <button
          onClick={onCopy}
          title={`Copy ${r.name} · status ${r.status}`}
          className={cn(
            'shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
            copied
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-zinc-900/40 border border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600'
          )}
        >
          {copied ? <><CheckCircle size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      {/* Error / uncollapsed diagnostic detail */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-rose-500/30 font-mono text-[10px] text-rose-300 leading-relaxed whitespace-pre-wrap break-words">
                <span className="text-rose-400 font-black mr-1.5">ERROR</span>
                {r.error}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[9px] text-zinc-600 font-mono">
                {r.ranAt && <span><Clock size={9} className="inline mr-1" />{new Date(r.ranAt).toLocaleTimeString()}</span>}
                <span className="px-1.5 py-0.5 rounded bg-zinc-900/40 border border-zinc-700/30 inline-flex items-center gap-1" style={{ color: accent }}>
                  <Info size={9} />
                  status {r.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Manual-copy fallback modal — shown when both the Clipboard API and the
// execCommand('copy') fallback fail (sandboxed iframe without
// clipboard-write grant, non-secure context, browser policy break).
// The textarea is focused and pre-selected on mount so the user can Ctrl+C
// / ⌘C immediately, and a "Re-select text" button recovers focus if the
// user accidentally tabs away.
// ──────────────────────────────────────────────────────────────────────────────

const ManualCopyModal: React.FC<{
  title: string;
  reason?: string;
  text: string;
  onClose: () => void;
}> = ({ title, reason, text, onClose }) => {
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = taRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);
  return (
    <div
      onClick={onClose}
      role="presentation"
      className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-copy-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={14} className="text-rose-300" />
          <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em]">
            Clipboard write blocked
          </p>
        </div>
        <h3 id="manual-copy-title" className="text-base font-black text-white">
          {title}
        </h3>
        {reason && (
          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed font-mono break-words">
            <span className="text-rose-400 font-black mr-1.5">REASON</span>
            {reason}
          </p>
        )}
        <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
          The browser blocked the automatic clipboard write. Press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px]">⌘C</kbd>{' '}
          /{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px]">Ctrl+C</kbd>{' '}
          on the textarea below to copy manually, or click <em>Re-select</em> if focus was lost.
        </p>
        <textarea
          ref={taRef}
          readOnly
          value={text}
          className="w-full h-64 mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-700/40 font-mono text-[10px] text-zinc-300 leading-relaxed resize-none focus:outline-none focus:border-zinc-600"
        />
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[9px] text-zinc-600 font-mono">
            {text.length} chars · {text.split('\n').length} lines
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = taRef.current;
                if (el) { el.focus(); el.select(); }
              }}
              className="px-3 py-1.5 rounded-xl border border-zinc-700/40 bg-zinc-900/30 hover:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-300 hover:text-white transition-all"
            >
              Re-select text
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/15 text-[10px] font-bold uppercase tracking-[0.1em] text-primary hover:bg-primary/25 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function maskSecret(value: string): string {
  if (!value) return '(missing)';
  // URLs are masked more aggressively — slice(-4) on a Supabase URL reveals
  // ".co" / ".app" which firms the project fingerprint without aiding the
  // admin (they already know the project). Keep the protocol prefix so they
  // can confirm http vs https, then collapse the rest to a length token.
  if (/^https?:\/\//i.test(value)) {
    const protocol = value.match(/^https?:\/\//i)?.[0] ?? '';
    return `${protocol}…(${value.length} chars)`;
  }
  if (value.length < 12) return `${value.slice(0, 2)}…(${value.length})`;
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

export default Diagnostics;
