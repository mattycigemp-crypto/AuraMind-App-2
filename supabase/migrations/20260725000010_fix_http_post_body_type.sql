-- AuraMind Database Migration: fix_http_post_body_type (reconstructed backfill)
-- Date: 2026-07-25 · Remote CLI name: fix_http_post_body_type · Version 20260725000010
--
-- Historical fix: pg_net >= 0.14 made net.http_post's `body` parameter jsonb
-- (the text variant was removed). This migration documents the corrected
-- signature on the live function so a future maintainer doesn't reintroduce a
-- text cast.
--
-- WHY THE COMMENT IS BEST-EFFORT
--
-- `COMMENT ON` requires ownership of the target, and net.http_post is owned by
-- supabase_admin -- not the role this runner connects as. So the bare COMMENT
-- failed with "42501: must be owner of function net.http_post" on every single
-- migrate run since July, and always would: nothing about it was going to start
-- working. Because it raised before reaching the ledger insert, the migration
-- was never recorded, so it retried and failed again the next run, forever.
--
-- A permanently red line in the migrate output is worse than useless -- it
-- trains you to ignore failures, which is exactly when a real one slips past.
--
-- The comment is documentation, not schema, so it is not worth holding up a
-- migration over. Swallow the privilege error and carry on; if the role ever
-- does own the function, the comment gets applied. Any other error still
-- propagates.

do $$
begin
  execute $c$
    comment on function net.http_post(text, jsonb, jsonb, jsonb, integer)
      is 'pg_net http_post: body is jsonb (pg_net >= 0.14). Never cast the body to text.'
  $c$;
exception
  when insufficient_privilege then
    raise notice 'skipping comment on net.http_post: not the owner (expected on hosted Supabase)';
  when undefined_function then
    raise notice 'skipping comment on net.http_post: signature not present';
end $$;

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260725000010_fix_http_post_body_type',
  'Reconstructed backfill: document net.http_post jsonb body signature'
)
ON CONFLICT (version) DO NOTHING;
