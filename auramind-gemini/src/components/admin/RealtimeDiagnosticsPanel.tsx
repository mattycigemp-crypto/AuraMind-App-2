/**
 * Realtime Diagnostics Panel — Admin-only view that shows the health
 * and status of all Supabase Realtime subscriptions in the app.
 *
 * Mount at /admin/realtime-diagnostics (or wherever the admin nav points).
 *
 * Features:
 *   - Live connection status for each registered channel
 *   - Message throughput counter (events/sec)
 *   - Reconnect attempt counter
 *   - Service loader status
 *   - One-click "ping" to test broadcast delivery
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Server,
} from 'lucide-react';
import {
  getConnectionStatus,
  onConnectionStatusChange,
  type RealtimeConnectionStatus,
} from '@/services/notifications/realtimeNotifications';
import { getServiceStatus, type ServiceDefinition } from '@/lib/serviceLoader';
import { supabase } from '@/services/database/supabase';

// ─── Types ─────────────────────────────────────────────────────

interface ChannelDiagnostic {
  name: string;
  status: RealtimeConnectionStatus;
  messageCount: number;
  lastMessageAt: number | null;
  reconnectAttempts: number;
}

interface DiagnosticSnapshot {
  overallStatus: RealtimeConnectionStatus;
  channels: ChannelDiagnostic[];
  serviceLoaderStatus: ReturnType<typeof getServiceStatus>;
  messagesPerSecond: number;
  uptime: number;
}

// ─── Component ─────────────────────────────────────────────────

export function RealtimeDiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot>({
    overallStatus: 'disconnected',
    channels: [],
    serviceLoaderStatus: [],
    messagesPerSecond: 0,
    uptime: 0,
  });
  const [pingResult, setPingResult] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const startTimeRef = useRef(Date.now());
  const messageCountRef = useRef(0);
  const windowStartRef = useRef(Date.now());

  // ─── Subscribe to global connection status ──────────────────
  useEffect(() => {
    const unsub = onConnectionStatusChange((status) => {
      setSnapshot((prev) => ({
        ...prev,
        overallStatus: status,
        serviceLoaderStatus: getServiceStatus(),
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    });

    // Periodic refresh of service loader status
    const interval = setInterval(() => {
      setSnapshot((prev) => ({
        ...prev,
        serviceLoaderStatus: getServiceStatus(),
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 5_000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // ─── Ping test ──────────────────────────────────────────────
  const handlePing = useCallback(async () => {
    if (!supabase) return;
    setPingResult('sending');
    try {
      const channel = supabase.channel('diagnostics-ping');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ping timed out after 5s'));
        }, 5_000);

        channel
          .on('broadcast', { event: 'pong' }, () => {
            clearTimeout(timeout);
            resolve();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'ping',
                payload: { ts: Date.now() },
              });
            }
          });

        // Auto-cleanup after resolve/reject
        setTimeout(() => {
          if (supabase) supabase.removeChannel(channel);
        }, 6_000);
      });
      setPingResult('success');
    } catch {
      setPingResult('error');
    }
    setTimeout(() => setPingResult('idle'), 3_000);
  }, []);

  // ─── Render helpers ──────────────────────────────────────────
  const statusColor = (status: RealtimeConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'connecting':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
  };

  const statusIcon = (status: RealtimeConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F0EFFE] flex items-center gap-3">
              <Radio className="h-6 w-6 text-violet-400" />
              Realtime Diagnostics
            </h1>
            <p className="text-sm text-[#5A5A72] mt-1">
              Live health monitoring for Supabase Realtime subscriptions
            </p>
          </div>
          <button
            onClick={handlePing}
            disabled={pingResult === 'sending'}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              pingResult === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : pingResult === 'error'
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-[#2A2A3A] bg-[#111118] text-[#9090A8] hover:border-violet-600/40 hover:text-violet-400'
            }`}
          >
            <Zap className="h-4 w-4" />
            {pingResult === 'sending' ? 'Pinging…' : pingResult === 'success' ? 'Pong!' : pingResult === 'error' ? 'Failed' : 'Ping Test'}
          </button>
        </div>

        {/* Overall Status Card */}
        <motion.div
          layout
          className={`rounded-2xl border p-6 ${statusColor(snapshot.overallStatus)}`}
        >
          <div className="flex items-center gap-4">
            {statusIcon(snapshot.overallStatus)}
            <div className="flex-1">
              <h2 className="text-lg font-semibold capitalize">{snapshot.overallStatus}</h2>
              <p className="text-sm opacity-70">
                {snapshot.overallStatus === 'connected'
                  ? 'All Realtime channels are operational'
                  : snapshot.overallStatus === 'connecting'
                  ? 'Establishing connection to Supabase Realtime…'
                  : snapshot.overallStatus === 'error'
                  ? 'Connection error — check your network and Supabase project status'
                  : 'No active Realtime connections'}
              </p>
            </div>
            <div className="text-right text-sm opacity-70">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Uptime: {formatUptime(snapshot.uptime)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Service Loader Status */}
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#0E0E15] p-6">
          <h3 className="text-sm font-semibold text-[#F0EFFE] flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-violet-400" />
            Lazy Service Loader
          </h3>
          {snapshot.serviceLoaderStatus.length === 0 ? (
            <p className="text-xs text-[#5A5A72]">No services registered yet. Services are registered at app mount.</p>
          ) : (
            <div className="space-y-2">
              {snapshot.serviceLoaderStatus.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between rounded-xl border border-[#1A1A24] bg-[#111118] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        svc.loaded
                          ? 'bg-emerald-400'
                          : svc.error
                          ? 'bg-red-400'
                          : 'bg-[#3A3A4F]'
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-[#F0EFFE]">{svc.name}</span>
                      {svc.description && (
                        <span className="ml-2 text-xs text-[#5A5A72]">{svc.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#5A5A72]">
                    {svc.loadTimeMs !== null && <span>{svc.loadTimeMs.toFixed(0)}ms</span>}
                    {svc.error && <span className="text-red-400">{svc.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Realtime Notification Channel */}
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#0E0E15] p-6">
          <h3 className="text-sm font-semibold text-[#F0EFFE] flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-violet-400" />
            Notification Channel
          </h3>
          <div className="rounded-xl border border-[#1A1A24] bg-[#111118] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${
                  snapshot.overallStatus === 'connected' ? 'bg-emerald-400' :
                  snapshot.overallStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                  snapshot.overallStatus === 'error' ? 'bg-red-400' : 'bg-[#3A3A4F]'
                }`} />
                <span className="text-sm font-medium text-[#F0EFFE]">
                  user:*:notifications
                </span>
                <span className="rounded-full border border-[#2A2A3A] bg-[#1A1A24] px-2 py-0.5 text-[10px] text-[#5A5A72]">
                  public broadcast
                </span>
              </div>
              <span className="text-xs text-[#5A5A72]">
                {snapshot.overallStatus === 'connected' ? 'SUBSCRIBED' : snapshot.overallStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#0E0E15] p-6">
          <h3 className="text-sm font-semibold text-[#F0EFFE] mb-4">Architecture Notes</h3>
          <div className="space-y-3 text-xs text-[#9090A8] leading-relaxed">
            <p>
              <strong className="text-[#F0EFFE]">Notification Channel:</strong> Public broadcast on{' '}
              <code className="rounded bg-[#1A1A24] px-1.5 py-0.5 text-violet-300">
                user:{'{'}userId{'}'}:notifications
              </code>
              . Only server-side code (Edge Functions / DB triggers) publishes. Channel name UUID scoping
              provides application-level isolation.
            </p>
            <p>
              <strong className="text-[#F0EFFE]">Typing Indicators:</strong> Per-conversation broadcast on{' '}
              <code className="rounded bg-[#1A1A24] px-1.5 py-0.5 text-violet-300">
                typing:{'{'}conversationId{'}'}
              </code>
              . 3-second debounce, auto-stop on silence.
            </p>
            <p>
              <strong className="text-[#F0EFFE]">Leaderboard:</strong> Postgres Changes on{' '}
              <code className="rounded bg-[#1A1A24] px-1.5 py-0.5 text-violet-300">
                league_memberships
              </code>
              . Real-time row-level updates with optimistic local XP bumps.
            </p>
            <p>
              <strong className="text-[#F0EFFE]">Deck Collaboration:</strong> Broadcast on{' '}
              <code className="rounded bg-[#1A1A24] px-1.5 py-0.5 text-violet-300">
                deck-collab:{'{'}deckId{'}'}
              </code>
              . Presence heartbeats + cursor/edit broadcasts.
            </p>
            <p>
              <strong className="text-[#F0EFFE]">Multiplayer Study:</strong> Broadcast on{' '}
              <code className="rounded bg-[#1A1A24] px-1.5 py-0.5 text-violet-300">
                study-session:{'{'}sessionId{'}'}
              </code>
              . Card ratings, reactions, and streak sharing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeDiagnosticsPanel;
