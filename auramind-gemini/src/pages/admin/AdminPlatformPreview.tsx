import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import PageShell from '../../components/dashboard/PageShell';
import { cn } from '../../lib/utils';
import {
  SmartphoneIcon as Smartphone,
  CodeIcon as Code,
  MonitorIcon as Monitor,
  GlobeIcon as Globe,
  RefreshCwIcon as RefreshCw,
  ExternalLinkIcon as ExternalLink,
  XIcon as X,
  PlayIcon as Play,
  PauseIcon as Pause,
  Maximize2Icon as Maximize2,
  SettingsIcon as Settings,
  SparklesIcon as Sparkles,
  LayersIcon as Layers,
} from '../../components/icons/CustomIcons';

type DeviceKey = 'ios' | 'android' | 'macos' | 'linux' | 'web';

interface DeviceSpec {
  key: DeviceKey;
  name: string;
  shortName: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent: string;          // hex for status bar / accent line
  bodyBg: string;          // frame background
  chrome: 'iphone' | 'pixel' | 'macos' | 'browser' | 'linux';
  aspect: { w: number; h: number }; // logical content aspect
  viewport: { w: number; h: number }; // exact viewport inside chrome
  urlSuffix: string;       // ?simulate_platform=...
  notes: string[];
}

const DEVICES: DeviceSpec[] = [
  {
    key: 'ios',
    name: 'iPhone — iOS',
    shortName: 'iOS',
    description: 'Capacitor native shell, iPhone 15-class',
    icon: Smartphone,
    accent: '#007AFF',
    bodyBg: '#1c1c1e',
    chrome: 'iphone',
    aspect: { w: 393, h: 852 },
    viewport: { w: 393, h: 760 },
    urlSuffix: '?simulate_platform=ios',
    notes: [
      'Bottom safe-area gestures',
      'Haptics enabled (Capacitor Haptics)',
      'Status bar follows iOS 17 dynamic island',
      'Notched canvas — content respects sensor housing',
    ],
  },
  {
    key: 'android',
    name: 'Android — Material You',
    shortName: 'Android',
    description: 'Capacitor native shell, Pixel 8-class',
    icon: Smartphone,
    accent: '#6750A4',
    bodyBg: '#1c1b1f',
    chrome: 'pixel',
    aspect: { w: 412, h: 915 },
    viewport: { w: 412, h: 825 },
    urlSuffix: '?simulate_platform=android',
    notes: [
      'Bottom gesture pill — Android 14 style',
      'Material You tonal palette derived from #6750A4',
      'Larger touch targets (48dp minimum)',
      'Predictive back gesture integrated',
    ],
  },
  {
    key: 'macos',
    name: 'Desktop — Tauri (macOS)',
    shortName: 'macOS',
    description: 'Tauri 2 native window on macOS Sonoma',
    icon: Monitor,
    accent: '#007AFF',
    bodyBg: '#2c2c2e',
    chrome: 'macos',
    aspect: { w: 1280, h: 800 },
    viewport: { w: 1280, h: 760 },
    urlSuffix: '?simulate_platform=macos',
    notes: [
      'Native traffic-light controls',
      'macOS menu bar integration',
      'Window chrome resizable via Tauri',
      'Keyboard shortcuts via ⌘ mapping',
    ],
  },
  {
    key: 'web',
    name: 'Web — Vercel Deploy',
    shortName: 'Web',
    description: 'Production web build (Vercel)',
    icon: Globe,
    accent: '#a855f7',
    bodyBg: '#18181b',
    chrome: 'browser',
    aspect: { w: 1440, h: 900 },
    viewport: { w: 1440, h: 840 },
    urlSuffix: '?simulate_platform=web',
    notes: [
      'Chrome desktop-class viewport',
      'PWA installable (manifest.json present)',
      'SEO meta + OpenGraph active',
      'Service worker for offline flashcards',
    ],
  },
  {
    key: 'linux',
    name: 'Linux — Tauri (Ubuntu 24.04)',
    shortName: 'Linux',
    description: 'Tauri 2 native window on Ubuntu/GNOME',
    icon: Monitor,
    accent: '#22c55e',
    // Slight green-tinted dark so the Linux frame is visually distinct
    // from the neutral grays used by macOS (#2c2c2e) and Web (#18181b).
    bodyBg: '#1a1f1c',
    chrome: 'linux',
    aspect: { w: 1280, h: 800 },
    viewport: { w: 1280, h: 760 },
    urlSuffix: '?simulate_platform=linux',
    notes: [
      'Native GTK window decorations (GNOME 46)',
      'Wayland-ready with X11 fallback',
      'Keyboard shortcuts via Ctrl mapping',
      'Distro-tested on Ubuntu / Fedora / Arch',
    ],
  },
];

interface AdminPlatformPreviewProps {
  className?: string;
}

const AdminPlatformPreview: React.FC<AdminPlatformPreviewProps> = ({ className }) => {
  const [origin, setOrigin] = useState<string>('');
  const [selected, setSelected] = useState<DeviceKey | 'all'>('all');
  const [refreshing, setRefreshing] = useState<Record<DeviceKey, boolean>>({
    ios: false,
    android: false,
    macos: false,
    linux: false,
    web: false,
  });
  const iframeRefs = useRef<Record<DeviceKey, HTMLIFrameElement | null>>({
    ios: null,
    android: null,
    macos: null,
    linux: null,
    web: null,
  });
  const [autoplay, setAutoplay] = useState(false);
  const [tabsLoaded, setTabsLoaded] = useState<Record<DeviceKey, boolean>>({
    ios: false,
    android: false,
    macos: false,
    linux: false,
    web: false,
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const buildUrl = (suffix: string) => `${origin}/${suffix}`;

  // Auto-rotation across devices in "all" view
  useEffect(() => {
    if (!autoplay || selected !== 'all') return;
    const order: DeviceKey[] = ['ios', 'android', 'macos', 'linux', 'web'];
    let idx = 0;
    const tick = () => {
      const device = DEVICES.find((d) => d.key === order[idx % order.length]);
      if (device) {
        Object.values(iframeRefs.current).forEach((frame) => {
          if (frame && frame.dataset.device !== device.key) {
            // Don't actually swap the iframe src — autoplay just visually pulses a focus ring
          }
        });
      }
      idx += 1;
    };
    const interval = window.setInterval(tick, 1800);
    return () => window.clearInterval(interval);
  }, [autoplay, selected]);

  const handleRefresh = (key: DeviceKey) => {
    setRefreshing((prev) => ({ ...prev, [key]: true }));
    const frame = iframeRefs.current[key];
    if (frame) {
      // Force iframe reload
      const src = frame.src;
      frame.src = 'about:blank';
      window.setTimeout(() => {
        if (frame) frame.src = src;
      }, 50);
    }
    window.setTimeout(() => setRefreshing((prev) => ({ ...prev, [key]: false })), 800);
  };

  const handleLoaded = (key: DeviceKey) => {
    setTabsLoaded((prev) => ({ ...prev, [key]: true }));
  };

  const visibleDevices = useMemo(() => {
    if (selected === 'all') return DEVICES;
    return DEVICES.filter((d) => d.key === selected);
  }, [selected]);

  return (
    <PageShell>
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20', className)}>
      {/* Header / Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
            <button
              onClick={() => setSelected('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all',
                selected === 'all'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent',
              )}
            >
              <Layers size={11} className="inline mr-1.5" />
              All Devices
            </button>
            {DEVICES.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  onClick={() => setSelected(d.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-1.5',
                    selected === d.key
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent',
                  )}
                >
                  <Icon size={11} />
                  {d.shortName}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setAutoplay(!autoplay)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-[0.15em] transition-all',
              autoplay
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-900/10 border-zinc-700/30 text-zinc-500 hover:text-zinc-300',
            )}
          >
            {autoplay ? <Pause size={11} /> : <Play size={11} />}
            Auto-cycle
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            SIM ACTIVE
          </span>
          <span>{origin || '...'}</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm flex items-start gap-3">
        <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
        <div className="text-[11px] text-zinc-400 leading-relaxed">
          The Device Lab renders the real AuraMind build inside each frame with a{' '}
          <code className="px-1.5 py-0.5 rounded bg-zinc-900/40 text-primary font-mono text-[10px]">
            ?simulate_platform=X
          </code>{' '}
          URL param. All components that read{' '}
          <code className="px-1.5 py-0.5 rounded bg-zinc-900/40 text-primary font-mono text-[10px]">
            usePlatform()
          </code>{' '}
          will see the simulated platform — useful for QA, marketing shots, and reproducing device-specific bugs.
        </div>
      </div>

      {/* Devices grid */}
      <div
        className={cn(
          'grid gap-8',
          selected === 'all'
            // 3-column desktop layout gives 5 devices a clean 3+2 rhythm;
            // 4 columns would force wrap at typical xl viewports since each
            // desktop frame is 560px wide.
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 max-w-3xl mx-auto',
        )}
      >
        {visibleDevices.map((device, idx) => (
          <DeviceFrame
            key={device.key}
            device={device}
            iframeUrl={buildUrl(device.urlSuffix)}
            accent={device.accent}
            loaded={tabsLoaded[device.key]}
            refreshing={refreshing[device.key]}
            autoplayPulse={autoplay && selected === 'all'}
            autoplayIndex={idx}
            setRef={(el) => {
              iframeRefs.current[device.key] = el;
            }}
            onLoaded={() => handleLoaded(device.key)}
            onRefresh={() => handleRefresh(device.key)}
          />
        ))}
      </div>

      {/* Spec / Notes panel */}
      {selected !== 'all' && (
        <DeviceSpecPanel
          device={DEVICES.find((d) => d.key === selected)!}
          url={buildUrl(DEVICES.find((d) => d.key === selected)!.urlSuffix)}
        />
      )}
    </div>
    </PageShell>
  );
};

// ---- Device Frame Subcomponent ----
interface DeviceFrameProps {
  device: DeviceSpec;
  iframeUrl: string;
  accent: string;
  loaded: boolean;
  refreshing: boolean;
  autoplayPulse: boolean;
  autoplayIndex: number;
  setRef: (el: HTMLIFrameElement | null) => void;
  onLoaded: () => void;
  onRefresh: () => void;
}

const DeviceFrame: React.FC<DeviceFrameProps> = React.memo(
  ({ device, iframeUrl, accent, loaded, refreshing, autoplayPulse, autoplayIndex, setRef, onLoaded, onRefresh }) => {
    const Icon = device.icon;
    // Desktop frames render wide and short; phones render tall and narrow.
    // Caps chosen so all 5 frames fit a 2-row grid at the xl breakpoint
    // without overflow. Earlier the inner viewport used
    // Math.min(viewport.w, 360) which capped a 1280x760 desktop at 360px
    // wide and made macOS / Web look like phones.
    const isPhone = device.chrome === 'iphone' || device.chrome === 'pixel';
    const maxW = isPhone ? 320 : 560;
    const maxH = isPhone ? 700 : 380;
    const scale = Math.min(maxW / device.viewport.w, maxH / device.viewport.h);
    const displayW = Math.round(device.viewport.w * scale);
    const displayH = Math.round(device.viewport.h * scale);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: autoplayPulse ? 1 + 0.02 * Math.sin(autoplayIndex * 0.6) : 1,
        }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
          <Icon size={12} color={accent} />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-300">
            {device.shortName}
          </span>
          <span className="text-[8px] text-zinc-600 font-mono">
            {device.viewport.w}×{device.viewport.h}
          </span>
        </div>

        {/* Frame */}
        <div
          className={cn(
            'relative shadow-2xl',
            isPhone ? 'rounded-[44px] p-[10px]' : 'rounded-[14px] p-[8px]'
          )}
          style={{
            background: `linear-gradient(140deg, ${device.bodyBg}, ${device.bodyBg}cc)`,
            border: `1px solid ${accent}30`,
          }}
        >
          {/* Outer device-specific chrome */}
          {device.chrome === 'iphone' && (
            <>
              <div
                className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[120px] h-[28px] rounded-full z-30"
                style={{ background: '#000' }}
              />
              <div
                className="absolute top-[28px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full z-40"
                style={{ background: '#1a1a1a' }}
              />
            </>
          )}

          {device.chrome === 'pixel' && (
            <div
              className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full z-30"
              style={{ background: '#0a0a0a' }}
            />
          )}

          {device.chrome === 'macos' && (
            <div className="absolute top-[18px] left-[18px] flex items-center gap-1.5 z-30">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            </div>
          )}

          {device.chrome === 'browser' && (
            <>
              <div className="absolute top-[16px] left-[18px] flex items-center gap-1.5 z-30">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[60%] h-[20px] rounded-md z-30 flex items-center justify-center text-[9px] font-mono text-zinc-500"
                style={{ background: '#27272a' }}
              >
                <Globe size={9} className="mr-1.5" />
                auramind.app
              </div>
            </>
          )}

          {device.chrome === 'linux' && (
            <>
              {/* GNOME-style window controls with a deliberately distinct
                  palette from macOS: deeper red, warmer yellow, mid green.
                  Combined with the green-tinted frame body and the centered
                  Activities pill, a user can identify Linux at a glance. */}
              <div className="absolute top-[18px] left-[18px] flex items-center gap-1.5 z-30">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
              </div>
              <div
                className="absolute top-[18px] left-1/2 -translate-x-1/2 h-[18px] px-3 rounded-md z-30 flex items-center justify-center text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300"
                style={{ background: '#27272a' }}
              >
                Activities
              </div>
            </>
          )}

          {/* Inner viewport with iframe — sized per device using an
              aspect-aware scale (displayW / displayH computed above) so
              phones stay tall and desktops render wide-and-short. */}
          <div
            className={cn(
              'relative overflow-hidden bg-zinc-950',
              isPhone ? 'rounded-[34px]' : 'rounded-[8px]'
            )}
            style={{
              width: `${displayW}px`,
              height: `${displayH}px`,
              maxWidth: '100%',
            }}
          >
            {/* Status bar overlay (iPhone / Android) */}
            {(device.chrome === 'iphone' || device.chrome === 'pixel') && (
              <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 text-[10px] font-bold z-20 pointer-events-none"
                style={{ color: device.chrome === 'iphone' ? '#fff' : '#e8e8e8' }}
              >
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: '8px' }}>•••</span>
                  <Wifi size={10} />
                  <span style={{ fontSize: '8px' }}>100%</span>
                </div>
              </div>
            )}

            {/* Loading shimmer */}
            {!loaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950 pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: `${accent}40`, borderTopColor: accent }}
                />
              </div>
            )}

            <iframe
              ref={setRef}
              data-device={device.key}
              src={iframeUrl}
              title={`${device.name} preview`}
              onLoad={onLoaded}
              className="w-full h-full border-0"
              style={{
                background: '#09090b',
                transform: 'scale(1)',
                transformOrigin: 'top left',
              }}
              // `allow-same-origin` keeps the iframe at the real localhost:3000
              // origin (instead of the null origin implied by `sandbox`), so:
              //   1. The simulated app inside retains access to its own
              //      localStorage (Supabase auth, theme, draft decks) — auth
              //      and theme previews work in the QA tool.
              //   2. Vite serves /@vite/client etc. as same-origin and the
              //      browser stops blocking those fetches at CORS even if
              //      vite.config.ts `server.cors` is ever off.
              // Combined with `allow-scripts` the browser shows a one-time
              // "sandboxed context can break sandbox" warning in console —
              // harmless for a dev-only QA tool, and worth it for the
              // localStorage retention.
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            />

            {/* Bottom nav overlay (mobile) */}
            {(device.chrome === 'iphone' || device.chrome === 'pixel') && (
              <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-around px-4 z-20 pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-1 h-1 rounded-full bg-white/60" />
                <div className="w-12 h-1.5 rounded-full bg-white/80" />
                <div className="w-1 h-1 rounded-full bg-white/60" />
              </div>
            )}

            {/* Title bar overlay (desktop-class: macOS / Linux) */}
            {(device.chrome === 'macos' || device.chrome === 'linux') && (
              <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-center text-[10px] font-bold text-zinc-400 z-20 pointer-events-none">
                {device.chrome === 'linux' ? 'AuraMind — Ubuntu 24.04 LTS' : 'AuraMind — Native Desktop'}
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={cn(refreshing && 'animate-spin')} />
            Refresh
          </button>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] font-bold text-zinc-400 hover:text-primary hover:border-primary/30 transition-all"
          >
            <ExternalLink size={11} />
            Open
          </a>
        </div>
      </motion.div>
    );
  },
);
DeviceFrame.displayName = 'DeviceFrame';

// ---- Spec panel for single device view ----
const DeviceSpecPanel: React.FC<{ device: DeviceSpec; url: string }> = ({ device, url }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid md:grid-cols-3 gap-4"
    >
      <div className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm md:col-span-2">
        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
          <Settings size={12} className="text-primary" />
          {device.name} · Build Notes
        </h4>
        <ul className="space-y-2">
          {device.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-primary mt-1">·</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
          <Code size={12} className="text-emerald-400" />
          Sim URL
        </h4>
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-700/30 font-mono text-[10px] text-emerald-300 break-all">
          {url}
        </div>
        <div className="mt-3 space-y-1 text-[10px] text-zinc-500 font-mono">
          <div>viewport: {device.viewport.w}×{device.viewport.h}</div>
          <div>aspect: {device.aspect.w}:{device.aspect.h}</div>
          <div>chrome: {device.chrome}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPlatformPreview;
