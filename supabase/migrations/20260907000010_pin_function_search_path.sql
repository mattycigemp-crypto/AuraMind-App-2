-- Pin search_path on every public function that lacked one.
--
-- Why this matters most for the first four: they are SECURITY DEFINER and
-- they are the admin gates named in CLAUDE.md (is_admin / is_super_admin
-- drive `current_user_is_admin()` checks). A SECURITY DEFINER function with
-- a mutable search_path resolves unqualified names using the CALLER's
-- search_path, so anything able to create an object in an earlier schema can
-- shadow a table or function the body references and have it run with the
-- definer's privileges. That is a privilege-escalation path straight into
-- the admin role.
--
-- The remaining seven are trigger functions running as invoker, so the risk
-- is far lower, but a pinned path is correct for them too and it clears the
-- advisor warnings in one pass.
--
-- `public, pg_temp` rather than Supabase's stricter `''`: an empty path
-- requires every reference inside each body to be schema-qualified, which
-- would mean rewriting eleven function definitions. Listing pg_temp LAST is
-- the part that closes the hole — it stops a temporary object being resolved
-- ahead of the real one. Behaviour is otherwise unchanged.
--
-- Idempotent: ALTER FUNCTION ... SET is safe to re-run.

-- SECURITY DEFINER — the ones that actually matter ────────────────────────
alter function public.is_admin(uuid)                     set search_path = public, pg_temp;
alter function public.is_super_admin(uuid)               set search_path = public, pg_temp;
alter function public.promote_admin(uuid, text)          set search_path = public, pg_temp;
alter function public.deactivate_admin(uuid)             set search_path = public, pg_temp;

-- SECURITY INVOKER trigger functions ──────────────────────────────────────
alter function public.auth_events_handler()                  set search_path = public, pg_temp;
alter function public.increment_enrolled_count(uuid)         set search_path = public, pg_temp;
alter function public.league_memberships_touch_updated_at()  set search_path = public, pg_temp;
alter function public.update_ai_chat_sessions_updated_at()   set search_path = public, pg_temp;
alter function public.update_league_memberships_updated_at() set search_path = public, pg_temp;
alter function public.update_profiles_updated_at()           set search_path = public, pg_temp;
alter function public.update_updated_at_column()             set search_path = public, pg_temp;

-- Migration bookkeeping (required by the supabaseContract regression test
-- and the run-migrations.js ledger).
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260907000010_pin_function_search_path',
  'Pin search_path on 11 public functions; closes escalation path on the 4 SECURITY DEFINER admin gates'
)
on conflict (version) do nothing;
