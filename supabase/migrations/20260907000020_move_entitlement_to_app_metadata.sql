-- Move the billing entitlement decision out of client-writable metadata.
--
-- THE BUG
--
-- `subscription_status` lived in user_metadata, which Supabase lets a
-- signed-in user write for themselves:
--
--     await supabase.auth.updateUser({ data: { subscription_status: 'active' } })
--
-- The Stripe webhook wrote it there and /api/subscription read it back, so
-- the paywall was gated on a field the client controls. Any account could
-- grant itself a permanent free subscription. CLAUDE.md already forbids
-- trusting user_metadata for admin authorization; billing needs the same
-- rule.
--
-- app_metadata is writable only with the service-role key, which never
-- leaves the server.
--
-- ORDERING MATTERS
--
-- Apply this BEFORE deploying the code that reads app_metadata. The reader
-- has no fallback to user_metadata on purpose — a fallback would restore the
-- exact hole, because an attacker could set user_metadata on an account with
-- no app_metadata entry and be entitled again. That means until this backfill
-- runs, existing subscribers would read as 'none'.
--
-- Applying this early is harmless: nothing reads app_metadata yet, so on the
-- current code it is an inert copy.
--
-- WHAT IT DOES
--
-- Copies subscription_status from user_metadata to app_metadata for every
-- user that has one, preserving any existing app_metadata (notably `role`,
-- which authorises admin access and must not be clobbered). user_metadata is
-- left untouched: display fields still live there, and leaving the old value
-- in place keeps a rollback possible.
--
-- Idempotent: re-running overwrites app_metadata with the same value.

update auth.users
   set raw_app_meta_data =
         coalesce(raw_app_meta_data, '{}'::jsonb)
         || jsonb_build_object('subscription_status', raw_user_meta_data->>'subscription_status')
 where raw_user_meta_data ? 'subscription_status'
   and raw_user_meta_data->>'subscription_status' is not null;

-- Verification, visible in the migration output. After this runs, the second
-- and third counts should match: every user with a status in user_metadata
-- now has the same value in app_metadata.
do $$
declare
  v_total int;
  v_user_meta int;
  v_app_meta int;
  v_mismatched int;
begin
  select count(*),
         count(*) filter (where raw_user_meta_data ? 'subscription_status'),
         count(*) filter (where raw_app_meta_data ? 'subscription_status'),
         count(*) filter (where raw_user_meta_data ? 'subscription_status'
                            and raw_app_meta_data->>'subscription_status'
                                is distinct from raw_user_meta_data->>'subscription_status')
    into v_total, v_user_meta, v_app_meta, v_mismatched
    from auth.users;

  raise notice 'entitlement backfill: % users, % with status in user_metadata, % now in app_metadata, % mismatched',
    v_total, v_user_meta, v_app_meta, v_mismatched;

  if v_mismatched > 0 then
    raise exception 'entitlement backfill left % user(s) mismatched — do not deploy the app_metadata reader', v_mismatched;
  end if;
end $$;

-- Migration bookkeeping (required by the supabaseContract regression test
-- and the run-migrations.js ledger).
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260907000020_move_entitlement_to_app_metadata',
  'Backfill subscription_status into app_metadata so entitlement is not client-writable'
)
on conflict (version) do nothing;
