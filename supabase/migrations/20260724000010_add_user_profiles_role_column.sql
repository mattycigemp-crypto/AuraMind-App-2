-- AuraMind Database Migration: add_user_profiles_role_column (reconstructed backfill)
-- Date: 2026-07-24 · Remote CLI name: add_user_profiles_role_column · Version 20260724000010
--
-- Adds the `role` column to user_profiles (default 'user'). Consumed by
-- sync_auth_role_to_profiles() (20260724000020) and the admin/RLS paths.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260724000010_add_user_profiles_role_column',
  'Reconstructed backfill: add user_profiles.role (default user)'
)
ON CONFLICT (version) DO NOTHING;
