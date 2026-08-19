-- AuraMind Database Migration: fix_http_post_body_type (reconstructed backfill)
-- Date: 2026-07-25 · Remote CLI name: fix_http_post_body_type · Version 20260725000010
--
-- Historical fix: pg_net >= 0.14 made net.http_post's `body` parameter jsonb
-- (the text variant was removed). This migration documents the corrected
-- signature on the live function so a future maintainer doesn't reintroduce a
-- text cast.

COMMENT ON FUNCTION net.http_post(text, jsonb, jsonb, jsonb, integer)
  IS 'pg_net http_post: body is jsonb (pg_net >= 0.14). Never cast the body to text.';

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260725000010_fix_http_post_body_type',
  'Reconstructed backfill: document net.http_post jsonb body signature'
)
ON CONFLICT (version) DO NOTHING;
