-- Close two findings from the Supabase security advisors.
--
-- 1. public.card_analytics leaked every user's card content.
--
--    The view selects c.user_id, c.front AS question and c.back AS answer
--    from cards, and 20260521_fsrs_factcheck.sql grants SELECT on it to
--    `authenticated`. Postgres views default to security_invoker = off,
--    which means the view executes as its OWNER and the row level security
--    on `cards` never applies. Any signed-in user querying card_analytics
--    therefore read every other user's flashcards — questions, answers and
--    user_ids — not just their own.
--
--    security_invoker = on makes the view run with the privileges and RLS
--    of the caller, so the existing cards policies apply and each user sees
--    only their own rows. The view definition and its grants are unchanged.
--
-- 2. public.card_reviews_backfill_audit had RLS disabled entirely.
--
--    anon and authenticated both hold SELECT and INSERT on it. The table is
--    empty today, so nothing leaked, but anyone holding the (public by
--    design) anon key could write rows into it. It is a one-off backfill
--    audit trail that only server-side code has any reason to touch, so RLS
--    is enabled with no policy: that denies every client role while leaving
--    service_role — which bypasses RLS — working as before.
--
-- Both changes are idempotent and safe to re-run.

-- 1 ────────────────────────────────────────────────────────────────────────
alter view if exists public.card_analytics set (security_invoker = on);

-- 2 ────────────────────────────────────────────────────────────────────────
alter table if exists public.card_reviews_backfill_audit enable row level security;

-- Migration bookkeeping (required by the supabaseContract regression test
-- and the run-migrations.js ledger).
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260907000000_close_card_analytics_rls_bypass',
  'card_analytics runs as invoker so cards RLS applies; enable RLS on card_reviews_backfill_audit'
)
on conflict (version) do nothing;
