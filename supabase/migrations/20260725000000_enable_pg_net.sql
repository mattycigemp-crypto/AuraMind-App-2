-- AuraMind Database Migration: enable_pg_net (reconstructed backfill)
-- Date: 2026-07-25 · Remote CLI name: enable_pg_net · Version 20260725000000
--
-- Enables the pg_net extension (installed in the `extensions` schema on the
-- remote) so net.http_post can dispatch the realtime notification POSTs.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260725000000_enable_pg_net',
  'Reconstructed backfill: enable pg_net extension for net.http_post notifications'
)
ON CONFLICT (version) DO NOTHING;
