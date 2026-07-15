import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import PageShell from '../../components/dashboard/PageShell';
import {
  ShieldIcon as Shield,
  LockIcon as Lock,
  CodeIcon as Code,
  DatabaseIcon as Database,
  ActivityIcon as Activity,
  AlertTriangleIcon as AlertTriangle,
  CheckIcon as Check,
  XIcon as X,
  RefreshCwIcon as RefreshCw,
  CopyIcon as Copy,
  LockKeyholeIcon as Key,
  ZapIcon as Zap,
  BrainCircuitIcon as BrainCircuit,
  SaveIcon as Save,
  ExternalLinkIcon as ExternalLink,
} from '../../components/icons/CustomIcons';

const STORAGE_KEY = 'auramind-admin-system-settings-v1';

interface SystemSettings {
  // Security
  mfaRequired: boolean;
  sessionExpiryMins: number;
  ipAllowlist: string;
  firewallLevel: 'permissive' | 'balanced' | 'aggressive';
  // Integrations
  slackWebhook: { active: boolean; url: string };
  awsS3: { active: boolean; bucket: string };
  runtimeSDK: { active: boolean };
  resendEmail: { active: boolean };
  // System
  maintenanceMode: boolean;
  featureFreeze: boolean;
  aiEngineRate: number;
  // Experimental
  darkMatterMode: boolean;
  neuralSyncBeta: boolean;
  glassmorphismIntensity: number;
}

const DEFAULT: SystemSettings = {
  mfaRequired: true,
  sessionExpiryMins: 15,
  ipAllowlist: '192.168.1.1, 10.0.0.45',
  firewallLevel: 'balanced',
  // Slack webhook starts inert: no active flag, no placeholder URL that scanners will
  // flag as a leaked secret. Admins paste the real webhook into the UI when ready.
  // Optionally pre-seed from VITE_SLACK_WEBHOOK_URL at build time if you maintain
  // a public default for staging. `import.meta.env` is typed loosely by Vite's
  // default ambient declarations, so no `any` cast is needed here.
  slackWebhook: { active: false, url: import.meta.env?.VITE_SLACK_WEBHOOK_URL || '' },
  awsS3: { active: false, bucket: 'auramind-cold-archive' },
  runtimeSDK: { active: true },
  resendEmail: { active: true },
  maintenanceMode: false,
  featureFreeze: false,
  aiEngineRate: 100,
  darkMatterMode: false,
  neuralSyncBeta: true,
  glassmorphismIntensity: 70,
};

function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

interface AdminSettingsProps {
  className?: string;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ className }) => {
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<null | { title: string; body: string; onConfirm: () => void; tone: 'danger' | 'info' }>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedAt(Date.now());
    } catch {/* ignore */}
  }, [settings]);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = (path: [string, string], value: any) => {
    setSettings((prev) => {
      const next: any = { ...prev };
      let cursor = next;
      for (let i = 0; i < path.length - 1; i++) {
        cursor[path[i]] = { ...cursor[path[i]] };
        cursor = cursor[path[i]];
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  const copyKey = (key: string, label: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const integrations = useMemo(() => [
    {
      key: 'slack' as const,
      name: 'Slack Enterprise',
      description: 'Relay system alerts and neural activity to dev channels.',
      active: settings.slackWebhook.active,
      icon: Activity,
      meta: settings.slackWebhook.url
        ? settings.slackWebhook.url.replace(/^https:\/\/hooks\.slack\.com\/services\//, 'services/')
        : 'Not configured',
      accent: 'purple',
    },
    {
      key: 'aws' as const,
      name: 'AWS S3 Archival',
      description: 'Automated cold storage for legacy snapshots over 90 days old.',
      active: settings.awsS3.active,
      icon: Database,
      meta: `s3://${settings.awsS3.bucket}`,
      accent: 'amber',
    },
    {
      key: 'runtime' as const,
      name: 'Runtime SDK',
      description: 'Direct injection of neural processing into frontend components.',
      active: settings.runtimeSDK.active,
      icon: Code,
      meta: 'v2.4.0',
      accent: 'emerald',
    },
    {
      key: 'resend' as const,
      name: 'Resend (Email)',
      description: 'Transactional email: password resets, billing alerts, study digests.',
      active: settings.resendEmail.active,
      icon: Shield,
      meta: 'auramind.app',
      accent: 'blue',
    },
  ], [settings]);

  return (
    <PageShell>
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20', className)}>
      {/* Save indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            <Shield size={12} className="text-primary" />
            System Configuration
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">Security, integrations, experimental flags. Auto-saves on change.</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
          {savedAt && (
            <span className="flex items-center gap-1.5">
              <Check size={10} className="text-emerald-400" />
              Saved {Math.round((Date.now() - savedAt) / 1000)}s ago
            </span>
          )}
          <button onClick={() => setSettings(loadSettings())} className="flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-700/30 hover:border-zinc-700/50 transition-all">
            <RefreshCw size={10} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Security */}
        <Card className="col-span-12 md:col-span-8">
          <SectionHeader icon={Lock} title="Security Protocols" subtitle="Encryption, authentication, access controls" badge="AES-256" badgeColor="cyan" />
          <div className="space-y-3">
            <ToggleRow
              label="Multi-Factor Authentication (MFA)"
              description="Required for all root access"
              on={settings.mfaRequired}
              onChange={(v) => update('mfaRequired', v)}
            />
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-700/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-zinc-200">Automated Session Expiry</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Force logout after inactivity</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.sessionExpiryMins}
                  onChange={(e) => update('sessionExpiryMins', Math.max(1, Math.min(1440, Number(e.target.value))))}
                  min={1}
                  max={1440}
                  className="w-16 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700/30 text-[11px] text-zinc-200 font-mono text-right focus:outline-none focus:border-primary/40"
                />
                <span className="text-[10px] text-zinc-500 font-mono">min</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1.5">Allowed IPs</div>
                <input
                  type="text"
                  value={settings.ipAllowlist}
                  onChange={(e) => update('ipAllowlist', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700/30 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1.5">Firewall Level</div>
                <select
                  value={settings.firewallLevel}
                  onChange={(e) => update('firewallLevel', e.target.value as SystemSettings['firewallLevel'])}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700/30 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-primary/40"
                >
                  <option value="permissive">PERMISSIVE_DEV</option>
                  <option value="balanced">STANDARD_BALANCED</option>
                  <option value="aggressive">AGGRESSIVE_STRICT</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* API Keys */}
        <Card className="col-span-12 md:col-span-4 border-l-2 border-l-cyan-400">
          <SectionHeader icon={Key} title="Gateway Keys" subtitle="Rotate API secrets" />
          <div className="space-y-3">
            <SecretRow label="Production API Key" value="sk-auramind-••••••••••••••••" onCopy={() => copyKey('sk-auramind-prod-a8f9e2d1c4b6', 'prod')} copied={copied === 'prod'} />
            <SecretRow label="Neural Engine ID" value="engine-x92-••••••••" onCopy={() => copyKey('engine-x92-prod-d4e7aa1', 'engine')} copied={copied === 'engine'} />
            <SecretRow label="Stripe Webhook Secret" value="whsec_••••••••" onCopy={() => copyKey('whsec_auramind_prod_8a3f', 'stripe')} copied={copied === 'stripe'} />
            <button
              onClick={() => setConfirmDialog({
                title: 'Rotate Secret Keys',
                body: 'All API keys will be regenerated. Connected clients will need to refresh within 1 hour.',
                tone: 'info',
                onConfirm: () => {
                  setConfirmDialog(null);
                  copyKey(`rotated-${Date.now().toString(36)}`, 'rotated');
                },
              })}
              className="w-full mt-2 px-3 py-2 rounded-xl border border-zinc-700/30 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-white hover:border-zinc-700/50 transition-all"
            >
              Rotate Secret Keys
            </button>
          </div>
        </Card>

        {/* Integrations */}
        <Card className="col-span-12">
          <SectionHeader icon={Activity} title="System Integrations" subtitle="Third-party services wired into the platform" badge={`${integrations.filter(i=>i.active).length} active`} badgeColor="emerald" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {integrations.map((it) => (
              <IntegrationCard
                key={it.key}
                name={it.name}
                description={it.description}
                active={it.active}
                meta={it.meta}
                accent={it.accent}
                icon={it.icon}
                onToggle={() => setSettings(prev => toggleIntegration(prev, it.key))}
              />
            ))}
          </div>
        </Card>

        {/* System Toggles */}
        <Card className="col-span-12 md:col-span-6">
          <SectionHeader icon={Zap} title="System Controls" subtitle="Runtime modes and rate limits" badge="Live" badgeColor="emerald" />
          <div className="space-y-3">
            <ToggleRow
              label="Maintenance Mode"
              description="Show 'down for maintenance' to all non-admin users"
              on={settings.maintenanceMode}
              tone="amber"
              onChange={(v) => update('maintenanceMode', v)}
            />
            <ToggleRow
              label="Feature Freeze"
              description="Halt all deploys and DB migrations for 24h"
              on={settings.featureFreeze}
              tone="amber"
              onChange={(v) => update('featureFreeze', v)}
            />
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-700/30">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-[11px] font-bold text-zinc-200">AI Engine Rate Limit</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Tokens per minute per user</div>
                </div>
                <span className="text-[11px] font-mono font-bold text-primary">{settings.aiEngineRate}k</span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={settings.aiEngineRate}
                onChange={(e) => update('aiEngineRate', Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((settings.aiEngineRate - 10) / 490) * 100}%, #3f3f46 ${((settings.aiEngineRate - 10) / 490) * 100}%, #3f3f46 100%)` }}
              />
            </div>
          </div>
        </Card>

        {/* Experimental */}
        <Card className="col-span-12 md:col-span-6">
          <SectionHeader icon={BrainCircuit} title="Labs · Experimental" subtitle="Beta features available for staging" badge="Beta" badgeColor="primary" />
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/[0.04] flex items-start gap-3">
              <div className="mt-1">
                <Toggle on={settings.neuralSyncBeta} onChange={(v) => update('neuralSyncBeta', v)} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-primary">Neural Sync Beta</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Direct memory bus integration for faster query resolving. Affects all real-time chat latency.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-700/30 flex items-start gap-3">
              <div className="mt-1">
                <Toggle on={settings.darkMatterMode} onChange={(v) => update('darkMatterMode', v)} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-300">Dark Matter Mode</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Extreme low-power UI profile for critical battery levels. Hides animations.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-700/30">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-[11px] font-bold text-zinc-200">Glassmorphism Intensity</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Backdrop blur strength across the app</div>
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-400">{settings.glassmorphismIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.glassmorphismIntensity}
                onChange={(e) => update('glassmorphismIntensity', Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #00dbe9 0%, #00dbe9 ${settings.glassmorphismIntensity}%, #3f3f46 ${settings.glassmorphismIntensity}%, #3f3f46 100%)` }}
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="col-span-12 border-2 border-red-500/30">
          <SectionHeader icon={AlertTriangle} title="Critical Termination" subtitle="Irreversible actions — authorized level 5 only" tone="danger" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DangerButton
              label="Purge Test Users"
              description="Delete all accounts flagged is_test_user=true. Wipes session data and decks."
              onClick={() => setConfirmDialog({
                title: 'Purge Test Users?',
                body: 'This permanently removes all test accounts (≈ built from create_test_user). Cannot be undone.',
                tone: 'danger',
                onConfirm: () => setConfirmDialog(null),
              })}
              variant="amber"
            />
            <DangerButton
              label="Purge System Database"
              description="Wipe all synced neural data. Requires 2 root approvals. Projects state to a snapshot before wipe."
              onClick={() => setConfirmDialog({
                title: 'PERMANENT DATABASE PURGE',
                body: 'This will erase ALL data. Two root approvals required. A snapshot will be created automatically. Continue?',
                tone: 'danger',
                onConfirm: () => setConfirmDialog(null),
              })}
              variant="red"
            />
          </div>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <ConfirmModal
            title={confirmDialog.title}
            body={confirmDialog.body}
            tone={confirmDialog.tone}
            onCancel={() => setConfirmDialog(null)}
            onConfirm={confirmDialog.onConfirm}
          />
        )}
      </AnimatePresence>
      </div>
    </PageShell>
  );
};

const toggleIntegration = (prev: SystemSettings, key: 'slack' | 'aws' | 'runtime' | 'resend'): SystemSettings => {
  const next = { ...prev };
  switch (key) {
    case 'slack': next.slackWebhook = { ...prev.slackWebhook, active: !prev.slackWebhook.active }; break;
    case 'aws': next.awsS3 = { ...prev.awsS3, active: !prev.awsS3.active }; break;
    case 'runtime': next.runtimeSDK = { active: !prev.runtimeSDK.active }; break;
    case 'resend': next.resendEmail = { active: !prev.resendEmail.active }; break;
  }
  return next;
};

// ---- Helper components ----
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm relative overflow-hidden', className)}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'primary';
  tone?: 'danger';
}> = ({ icon: Icon, title, subtitle, badge, badgeColor, tone }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', tone === 'danger' ? 'bg-red-500/10 border border-red-500/30' : 'bg-primary/10 border border-primary/20')}>
        <Icon size={14} className={tone === 'danger' ? 'text-red-400' : 'text-primary'} />
      </div>
      <div>
        <h3 className={cn('text-[11px] font-black uppercase tracking-[0.15em]', tone === 'danger' ? 'text-red-400' : 'text-white')}>{title}</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
    {badge && (
      <span className={cn(
        'text-[9px] font-mono px-2 py-1 rounded border uppercase tracking-[0.1em]',
        badgeColor === 'cyan' && 'bg-cyan-950 text-cyan-400 border-cyan-400/30',
        badgeColor === 'emerald' && 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        badgeColor === 'amber' && 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        badgeColor === 'primary' && 'bg-primary/10 text-primary border-primary/20',
      )}>
        {badge}
      </span>
    )}
  </div>
);

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; tone?: 'amber' | 'red' }> = ({ on, onChange, tone }) => {
  const onColor = tone === 'amber' ? 'bg-amber-400' : tone === 'red' ? 'bg-red-400' : 'bg-primary';
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn('relative inline-flex h-4 w-7 items-center rounded-full transition-colors', on ? onColor : 'bg-zinc-700')}
      role="switch"
      aria-checked={on}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className={cn('inline-block h-2.5 w-2.5 rounded-full bg-zinc-950', on ? 'translate-x-4' : 'translate-x-1')}
      />
    </button>
  );
};

const ToggleRow: React.FC<{
  label: string;
  description: string;
  on: boolean;
  onChange: (v: boolean) => void;
  tone?: 'amber' | 'red';
}> = ({ label, description, on, onChange, tone }) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-700/30">
    <div>
      <div className={cn('text-[11px] font-bold', tone === 'amber' && on ? 'text-amber-300' : 'text-zinc-200')}>{label}</div>
      <div className="text-[10px] text-zinc-500 mt-0.5">{description}</div>
    </div>
    <Toggle on={on} onChange={onChange} tone={tone} />
  </div>
);

const SecretRow: React.FC<{ label: string; value: string; onCopy: () => void; copied: boolean }> = ({ label, value, onCopy, copied }) => (
  <div>
    <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1.5">{label}</div>
    <div className="relative">
      <input
        type="password"
        value={value}
        readOnly
        className="w-full px-3 py-2 pr-10 rounded-lg bg-zinc-950 border border-zinc-700/30 text-[11px] text-zinc-400 font-mono focus:outline-none"
      />
      <button
        onClick={onCopy}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-primary transition-colors"
        title="Copy"
      >
        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      </button>
    </div>
  </div>
);

const IntegrationCard: React.FC<{
  name: string;
  description: string;
  active: boolean;
  meta: string;
  accent: string;
  icon: React.FC<{ size?: number; className?: string }>;
  onToggle: () => void;
}> = ({ name, description, active, meta, accent, icon: Icon, onToggle }) => {
  const status = active
    ? accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      : accent === 'amber' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      : accent === 'blue' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
      : 'bg-primary/10 text-primary border-primary/20'
    : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';

  return (
    <div className={cn(
      'p-3 rounded-xl border transition-all',
      active ? 'border-zinc-700/30 bg-zinc-900/10' : 'border-zinc-700/20 bg-zinc-900/5 opacity-70',
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-zinc-900/40 border border-zinc-700/30 flex items-center justify-center">
          <Icon size={14} className="text-primary" />
        </div>
        <span className={cn('text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border', status)}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="text-[11px] font-bold text-white">{name}</div>
      <div className="text-[9px] text-zinc-500 leading-relaxed mt-1">{description}</div>
      <div className="text-[9px] text-zinc-400 font-mono mt-2 truncate">{meta}</div>
      <button
        onClick={onToggle}
        className="w-full mt-3 px-3 py-1.5 rounded-lg border border-zinc-700/30 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-white hover:border-primary/40 transition-all"
      >
        {active ? 'Configure' : 'Connect'}
      </button>
    </div>
  );
};

const DangerButton: React.FC<{
  label: string;
  description: string;
  onClick: () => void;
  variant: 'amber' | 'red';
}> = ({ label, description, onClick, variant }) => (
  <button
    onClick={onClick}
    className={cn(
      'p-4 rounded-xl border text-left transition-all group',
      variant === 'red'
        ? 'border-red-500/30 bg-red-500/[0.04] hover:bg-red-500/10'
        : 'border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/10',
    )}
  >
    <div className={cn(
      'text-[11px] font-black uppercase tracking-[0.15em] mb-1',
      variant === 'red' ? 'text-red-400' : 'text-amber-400',
    )}>{label}</div>
    <div className="text-[10px] text-zinc-500 leading-relaxed">{description}</div>
    <div className={cn(
      'mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono',
      variant === 'red' ? 'text-red-400' : 'text-amber-400',
    )}>
      AUTHORIZE &rarr;
    </div>
  </button>
);

const ConfirmModal: React.FC<{
  title: string;
  body: string;
  tone: 'danger' | 'info';
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, body, tone, onCancel, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="w-full max-w-md bg-zinc-950 border border-zinc-700/30 rounded-2xl p-6 backdrop-blur-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          tone === 'danger' ? 'bg-red-500/10 border border-red-500/30' : 'bg-primary/10 border border-primary/30',
        )}>
          <AlertTriangle size={18} className={tone === 'danger' ? 'text-red-400' : 'text-primary'} />
        </div>
        <div>
          <h3 className={cn('text-sm font-black uppercase tracking-[0.1em]', tone === 'danger' ? 'text-red-400' : 'text-white')}>{title}</h3>
          <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{body}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-5 pt-4 border-t border-zinc-700/30">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl bg-zinc-900/50 text-zinc-300 text-[11px] font-bold hover:bg-zinc-900/80 transition-all">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'flex-1 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all',
            tone === 'danger'
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30',
          )}
        >
          Confirm
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default AdminSettings;
