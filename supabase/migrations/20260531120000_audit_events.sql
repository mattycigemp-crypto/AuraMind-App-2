-- AuraMind Database Migration: Audit Events
-- Run this in your Supabase SQL Editor to add audit logging
-- Date: 2026-05-31
-- Version: 3.0.0

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('user', 'subscription', 'admin', 'database', 'system', 'security')),
  target_id TEXT,
  target_email TEXT,
  details TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_category_created ON audit_events(category, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit events (idempotent)
DROP POLICY IF EXISTS "Admins can read audit events" ON audit_events;
CREATE POLICY "Admins can read audit events" ON audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Only service role can insert (via API) (idempotent)
DROP POLICY IF EXISTS "Service role can insert audit events" ON audit_events;
CREATE POLICY "Service role can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Insert some seed audit events for demo purposes
INSERT INTO audit_events (actor_email, action, category, target_email, details, severity) VALUES
  ('admin@auramind.app', 'User role updated', 'admin', 'john@example.com', 'Changed role from "user" to "admin"', 'info'),
  ('system@auramind.app', 'Subscription activated', 'subscription', 'jane@example.com', 'Pro plan subscription started via Stripe checkout', 'info'),
  ('admin@auramind.app', 'SQL query executed', 'database', NULL, 'SELECT query on auth.users table - 247 rows returned', 'info'),
  ('unknown@external.com', 'Failed login attempt', 'security', 'user@example.com', '3 consecutive failed login attempts from IP 192.168.1.100', 'warning'),
  ('admin@auramind.app', 'Coupon created', 'admin', NULL, 'Created 25% off coupon "LAUNCH25" valid for 3 months', 'info'),
  ('admin@auramind.app', 'Account deleted', 'user', 'test@example.com', 'Permanently deleted test account and all associated data', 'critical'),
  ('admin@auramind.app', 'Database schema inspected', 'database', NULL, 'Viewed schema for tables: decks, cards, user_profiles', 'info'),
  ('system@auramind.app', 'SSL certificate renewed', 'system', NULL, 'Auto-renewed SSL certificate for auramind.app - valid until Aug 2026', 'info'),
  ('system@auramind.app', 'Webhook delivery failed', 'system', NULL, 'Stripe webhook endpoint returned 500 after 3 retry attempts', 'warning'),
  ('rate-limiter@system', 'API rate limit triggered', 'security', 'user@example.com', 'User exceeded 100 requests/minute threshold - temporarily blocked for 5 minutes', 'warning'),
  ('sarah@example.com', 'Subscription cancelled', 'subscription', 'sarah@example.com', 'Pro plan cancelled - will remain active until billing period ends', 'info'),
  ('owner@auramind.app', 'Admin promotion', 'admin', 'mike@example.com', 'Promoted mike@example.com to admin role with full permissions', 'info');
