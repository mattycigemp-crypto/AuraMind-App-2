-- Verification probe: confirm the auth-metadata fallback landed and the
-- schema_migrations row inserted cleanly.

SELECT
  (SELECT COUNT(*) FROM schema_migrations WHERE version = '20260723_admin_auth_metadata_fallback')::INT AS fallback_migration_recorded,
  (SELECT COUNT(*) FROM schema_migrations WHERE version = '20260723_postgrest_reload_and_session_fks')::INT AS cache_reload_recorded,
  (
    SELECT prosrc LIKE '%raw_user_meta_data%'
    FROM pg_proc WHERE proname = 'current_user_is_admin'
  )::INT AS function_includes_auth_metadata_branch,
  (
    SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_schema = 'public'
       AND constraint_name IN ('study_sessions_deck_id_join_fkey','card_reviews_card_id_join_fkey')
  )::INT AS reapply_fks_landed,
  (SELECT COUNT(*) FROM user_profiles)::INT AS user_profiles_count,
  (SELECT COUNT(*) FROM profiles)::INT AS profiles_count;
