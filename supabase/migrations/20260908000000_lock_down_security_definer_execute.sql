-- Stop `anon` from calling SECURITY DEFINER functions over the REST API.
--
-- THE PROBLEM
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and
-- PostgREST exposes every public-schema function at /rest/v1/rpc/<name>.
-- Both `anon` and `authenticated` inherit PUBLIC, so all 18 SECURITY
-- DEFINER functions were callable by anyone holding the anon key -- which
-- ships in the client bundle and is therefore public knowledge.
--
-- Most of them do guard themselves (they compare against auth.uid(), which
-- is null for anon, and raise). Three did not:
--
--   * prune_processed_webhook_events() -- unguarded DELETE. Bounded: it only
--     removes rows already older than 90 days, so the worst an anon caller
--     can do is run the scheduled cleanup early. Still nobody's business.
--   * is_admin(uuid) / is_super_admin(uuid) -- take an arbitrary uuid rather
--     than auth.uid(), so anon could probe whether a given account is an
--     admin.
--
-- Relying on each function to guard itself is the wrong default anyway: it
-- makes every future SECURITY DEFINER function a potential hole unless its
-- author remembers. Revoking from PUBLIC makes the grant explicit instead.
--
-- ORDERING MATTERS -- the policy fix comes first
--
-- The `audit_events` policy "Admins can read audit events" was scoped to
-- the {public} role and calls is_admin(auth.uid()). `anon` holds SELECT on
-- that table, so an anonymous read evaluates the policy and calls is_admin.
-- Revoking EXECUTE first would turn a quiet empty result into
-- "permission denied for function is_admin" -- a 500 where there used to be
-- an empty list.
--
-- Re-scoping the policy to `authenticated` is behaviour-preserving:
-- auth.uid() is null for anon, so is_admin(null) was already false and anon
-- already read back nothing.
--
-- Idempotent: REVOKE of a grant that is not held is a no-op, GRANT of one
-- already held is a no-op, and the policy is dropped before recreation.

-- 1. Re-scope the one policy that calls is_admin() as the PUBLIC role.
drop policy if exists "Admins can read audit events" on public.audit_events;
create policy "Admins can read audit events"
  on public.audit_events
  for select
  to authenticated
  using (is_admin(auth.uid()));

-- 2. Trigger functions. Never meant to be called as RPCs at all; Postgres
--    checks EXECUTE at CREATE TRIGGER time, not when the trigger fires, so
--    revoking here does not affect the triggers that use them.
revoke all on function public.broadcast_user_notification() from public, anon, authenticated;
revoke all on function public.create_email_preferences_for_user() from public, anon, authenticated;
revoke all on function public.sync_auth_role_to_profiles() from public, anon, authenticated;

-- 3. Maintenance function. Driven by the cron job, which uses the service
--    role -- no app user ever calls it.
revoke all on function public.prune_processed_webhook_events() from public, anon, authenticated;
grant execute on function public.prune_processed_webhook_events() to service_role;

-- 4. User-facing RPCs. Drop the implicit PUBLIC/anon grant, then hand
--    EXECUTE back to signed-in users explicitly. Each still performs its
--    own auth.uid() / admin check -- this narrows who can reach that check,
--    it does not replace it.
revoke all on function public.avatar_upload_secure(p_filename text, p_mime_type text) from public, anon;
grant execute on function public.avatar_upload_secure(p_filename text, p_mime_type text) to authenticated;

revoke all on function public.bump_forks_and_unpublish(p_deck_id uuid, p_unpublish boolean) from public, anon;
grant execute on function public.bump_forks_and_unpublish(p_deck_id uuid, p_unpublish boolean) to authenticated;

revoke all on function public.count_user_lapses(p_user_id uuid) from public, anon;
grant execute on function public.count_user_lapses(p_user_id uuid) to authenticated;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

revoke all on function public.deactivate_admin(target_user uuid) from public, anon;
grant execute on function public.deactivate_admin(target_user uuid) to authenticated;

revoke all on function public.increment_weekly_xp(p_user_id uuid, p_group_id text, p_tier integer, p_xp_delta integer, p_accuracy numeric) from public, anon;
grant execute on function public.increment_weekly_xp(p_user_id uuid, p_group_id text, p_tier integer, p_xp_delta integer, p_accuracy numeric) to authenticated;

revoke all on function public.is_admin(user_uuid uuid) from public, anon;
grant execute on function public.is_admin(user_uuid uuid) to authenticated;

revoke all on function public.is_super_admin(user_uuid uuid) from public, anon;
grant execute on function public.is_super_admin(user_uuid uuid) to authenticated;

revoke all on function public.list_admin_users_secure(p_search_term text) from public, anon;
grant execute on function public.list_admin_users_secure(p_search_term text) to authenticated;

revoke all on function public.promote_admin(target_user uuid, new_role text) from public, anon;
grant execute on function public.promote_admin(target_user uuid, new_role text) to authenticated;

revoke all on function public.prune_old_chat_sessions(p_user_id uuid, p_max_count integer) from public, anon;
grant execute on function public.prune_old_chat_sessions(p_user_id uuid, p_max_count integer) to authenticated;

revoke all on function public.record_card_review(p_card_id uuid, p_rating integer, p_srs_result jsonb, p_user_id uuid, p_srs_algorithm text, p_reviewed_at timestamp with time zone) from public, anon;
grant execute on function public.record_card_review(p_card_id uuid, p_rating integer, p_srs_result jsonb, p_user_id uuid, p_srs_algorithm text, p_reviewed_at timestamp with time zone) to authenticated;

revoke all on function public.toggle_admin_secure(p_target_uuid uuid, p_make_admin boolean) from public, anon;
grant execute on function public.toggle_admin_secure(p_target_uuid uuid, p_make_admin boolean) to authenticated;

revoke all on function public.upsert_user_fsrs_params(p_user_id uuid, p_weights jsonb, p_review_count integer, p_accuracy_baseline numeric, p_loss_value numeric, p_profile_label text) from public, anon;
grant execute on function public.upsert_user_fsrs_params(p_user_id uuid, p_weights jsonb, p_review_count integer, p_accuracy_baseline numeric, p_loss_value numeric, p_profile_label text) to authenticated;

-- 5. Verify, and fail loudly rather than half-applying.
do $$
declare
  v_anon int;
begin
  select count(*) into v_anon
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and has_function_privilege('anon', p.oid, 'EXECUTE');

  raise notice 'security definer functions still executable by anon: %', v_anon;

  if v_anon > 0 then
    raise exception 'expected 0 anon-executable SECURITY DEFINER functions, found %', v_anon;
  end if;
end $$;

INSERT INTO schema_migrations (version, description)
VALUES (
  '20260908000000_lock_down_security_definer_execute',
  'Revoke EXECUTE from anon/PUBLIC on SECURITY DEFINER functions; scope audit_events admin policy to authenticated'
)
on conflict (version) do nothing;
