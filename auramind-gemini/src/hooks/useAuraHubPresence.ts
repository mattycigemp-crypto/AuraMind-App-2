import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, requireSupabase } from '../services/database/supabase';

export interface OnlineUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status: 'studying' | 'browsing' | 'idle';
  lastSeen: number;
}

const CHANNEL_NAME = 'aurahub:global-presence';
const HEARTBEAT_INTERVAL = 8_000;
const PRUNE_AFTER = 25_000;

function broadcastPayload(userId: string, displayName: string, avatarUrl: string | undefined, status: OnlineUser['status']) {
  return { userId, displayName, avatarUrl, status, lastSeen: Date.now() };
}

export function useAuraHubPresence(userId: string, displayName: string, avatarUrl?: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const pendingRef = useRef<Array<{ event: string; payload: any }>>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const peersRef = useRef<Map<string, OnlineUser>>(new Map());

  const flushPending = useCallback(() => {
    if (!channelRef.current || !subscribedRef.current) return;
    while (pendingRef.current.length > 0) {
      const msg = pendingRef.current.shift()!;
      channelRef.current.send({ type: 'broadcast', ...msg });
    }
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = requireSupabase().channel(CHANNEL_NAME, {
      config: { broadcast: { ack: false } },
    });

    const peers = peersRef.current;

    channel
      .on('broadcast', { event: 'heartbeat' }, (event: any) => {
        const p = event.payload as OnlineUser;
        if (p.userId === userId) return;
        peersRef.current.set(p.userId, { ...p, lastSeen: Date.now() });
        setOnlineUsers(Array.from(peersRef.current.values()));
      })
      .on('broadcast', { event: 'leave' }, (event: any) => {
        const { userId: leftId } = event.payload as { userId: string };
        peersRef.current.delete(leftId);
        setOnlineUsers(Array.from(peersRef.current.values()));
      })
      .on('broadcast', { event: 'status' }, (event: any) => {
        const p = event.payload as { userId: string; status: OnlineUser['status'] };
        if (p.userId === userId) return;
        const existing = peersRef.current.get(p.userId);
        if (existing) {
          existing.status = p.status;
          setOnlineUsers(Array.from(peersRef.current.values()));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          flushPending();
        }
      });

    channelRef.current = channel;

    return () => {
      subscribedRef.current = false;
      if (channelRef.current && supabase) {
        requireSupabase().removeChannel(channelRef.current);
        channelRef.current = null;
      }
      peers.clear();
    };
  }, [userId, displayName, avatarUrl, flushPending]);

  useEffect(() => {
    if (!subscribedRef.current) {
      pendingRef.current.push({
        event: 'heartbeat',
        payload: broadcastPayload(userId, displayName, avatarUrl, 'browsing'),
      });
      return;
    }
    channelRef.current?.send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: broadcastPayload(userId, displayName, avatarUrl, 'browsing'),
    });
  }, [userId, displayName, avatarUrl]);

  useEffect(() => {
    if (!channelRef.current) return;
    const heartbeat = setInterval(() => {
      if (subscribedRef.current) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: broadcastPayload(userId, displayName, avatarUrl, 'browsing'),
        });
      }
      const now = Date.now();
      let changed = false;
      peersRef.current.forEach((peer, id) => {
        if (now - peer.lastSeen > PRUNE_AFTER) {
          peersRef.current.delete(id);
          changed = true;
        }
      });
      if (changed) setOnlineUsers(Array.from(peersRef.current.values()));
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(heartbeat);
  }, [userId, displayName, avatarUrl]);

  const updateStatus = useCallback((status: OnlineUser['status']) => {
    if (!channelRef.current || !subscribedRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'status',
      payload: { userId, status },
    });
  }, [userId]);

  return { onlineUsers, updateStatus, count: onlineUsers.length + 1 };
}
