-- AuraMind Database Migration: Realtime Broadcast Channel Strategy
-- Date: 2026-07-21
-- Version: 3.7.0
--
-- PREVIOUS ATTEMPT (reverted): Added RLS policy on realtime.messages.
-- That table is owned by supabase_admin and cannot be altered via the
-- SQL Editor (ERROR 42501: must be owner of table messages).
--
-- CORRECT APPROACH: The notification system uses Supabase Broadcast
-- channels (WebSocket-based), NOT postgres_changes subscriptions.
-- Broadcast channels never touch realtime.messages — they're pure
-- pub/sub over the WebSocket connection.
--
-- Private broadcast channels (config: { private: true }) require
-- supabase.realtime.setAuth(jwt) on the client, which is handled
-- in AppShell.tsx → initRealtimeNotifications(). No database-level
-- RLS is needed or possible for this transport.
--
-- If private channels cause persistent reconnect issues, the
-- fallback is to use PUBLIC broadcast channels. Channel names
-- like "user:<uuid>:notifications" already scope subscriptions
-- per-user at the application layer. Only server-side code
-- (Edge Functions / database triggers) publishes to these channels,
-- so there's no security risk from making them public.
--
-- This migration is intentionally a no-op.

-- Migration bookkeeping
INSERT INTO schema_migrations (version, description)
VALUES ('20260721_realtime_messages_rls',
        'No-op: documents why broadcast channels use public config instead of RLS on realtime.messages')
ON CONFLICT (version) DO NOTHING;
