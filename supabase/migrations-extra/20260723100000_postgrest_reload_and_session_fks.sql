-- AuraMind Database Migration: PostgREST schema cache reload + FK integrity
-- Date: 2026-07-23
-- Version: 3.8.0
--
-- Targets two live runtime errors observed in the dev console:
--
--   1) POST /rest/v1/rpc/list_admin_users_secure → 403 Forbidden
--      Even though the function + GRANTs exist (verified via
--      information_schema.routine_privileges), the PostgREST gateway
--      still denies the call. Root cause is a stale schema cache —
--      adding a new SECURITY DEFINER RPC doesn't trigger PostgREST's
--      auto-reload for hosted instances; you have to NOTIFY manually.
--
--   2) GET /rest/v1/study_sessions?select=...,decks(title) → 400
--      PostgREST can't materialise the embedded `decks(title)` join
--      because either:
--        (a) the postgrest schema cache didn't pick up the existing FK,
--        (b) the column was renamed and PostgREST's cached metadata
--            disagrees with the live schema.
--      Same root cause: cache is stale.  We also idempotently assert
--      the FK exists so a future clone of the schema is self-healing.
--
-- The migration is intentionally idempotent (DO $$ ... $$, IF NOT EXISTS,
-- ALTER TABLE ADD CONSTRAINT only when missing).
--
-- Side effect on every apply: NOTIFY pgrst, 'reload schema'; — fires the
-- gateway to drop its cached introspection and re-read pg_catalog. This
-- is cheap (<1 ms) and safe to re-run.

-- ============================================================
-- 1. study_sessions.deck_id → decks.id
-- ============================================================
-- `study_sessions.deck_id` is the column used by `useSessionReplay.ts`
-- for the embedded `decks(title)` expansion. If the FK was stripped
-- (e.g. by an earlier `DROP CONSTRAINT` that wasn't recreated), the
-- embedded-resource expansion in PostgREST silently fails with 400.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = 'study_sessions'
       AND tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'deck_id'
  ) THEN
    -- Postgres' standard `ALTER TABLE … ADD CONSTRAINT` does NOT support
    -- `IF NOT EXISTS`. The DO-block existence check above is the only
    -- idempotency layer; the constraint name itself is suffixed
    -- `_join_fkey` so it cannot collide with the auto-named FK that
    -- migration 20260709_core_tables.sql created for the same column.
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_deck_id_join_fkey
      FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 2. card_reviews.card_id → cards.id
-- ============================================================
-- Same pattern as above — `useSessionReplay.ts` does an embedded
-- `cards(front, back)` expansion in its second query. Auto-rebuilt.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = 'card_reviews'
       AND tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'card_id'
  ) THEN
    -- `ADD CONSTRAINT IF NOT EXISTS` is NOT valid Postgres syntax for this
    -- constraint type on the Supabase PG version, so the idempotency
    -- guard lives in the DO block above. The constraint name suffix
    -- `_join_fkey` keeps it clear of any auto-named FK already attached
    -- to the same column from a previous migration.
    --
    -- ON DELETE CASCADE here matches the original semantics from
    -- migration 20260709_core_tables.sql: when a card is deleted, its
    -- review history is wiped. Future migration can switch to
    -- ON DELETE SET NULL if audit preservation becomes a product
    -- requirement (would also require ALTER COLUMN card_id DROP NOT NULL).
    ALTER TABLE public.card_reviews
      ADD CONSTRAINT card_reviews_card_id_join_fkey
      FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3. PostgREST schema cache reload (the actual fix)
-- ============================================================
-- `NOTIFY pgrst, 'reload schema'` triggers PostgREST to drop its
-- introspected-schema cache and rebuild it from pg_catalog. This
-- is the documented way to force a hosted PostgREST to pick up
-- new RPCs and re-resolve relationship expansions after a schema
-- change. Without it, the gateway serves stale metadata and emits
-- 4xx for queries that have been valid SQL for weeks.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 4. Bookkeeping
-- ============================================================
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260723100000_postgrest_reload_and_session_fks',
  'Idempotently restores study_sessions/card_reviews FKs + reloads PostgREST schema cache (fixes live 403 RPC + 400 study_sessions.join).'
)
ON CONFLICT (version) DO NOTHING;
