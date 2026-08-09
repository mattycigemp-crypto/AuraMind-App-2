-- Security: harden the execute_sql(text) RPC.
--
-- The previous version (20260531100000_execute_sql.sql) was SECURITY DEFINER,
-- GRANTed to the `authenticated` role, and its "read-only" guard only checked
-- the query PREFIX. That guard is trivially bypassable — `EXPLAIN ANALYZE
-- DELETE FROM cards` or a data-modifying CTE (`WITH x AS (DELETE FROM cards
-- ...) SELECT ...`) both pass the prefix check and execute writes with the
-- function owner's (postgres-level) privileges. Any signed-in user could call
-- it directly via supabase.rpc() and destroy or exfiltrate data.
--
-- Fix applied here:
--   * drop the definer-rights function and recreate it as SECURITY INVOKER,
--   * revoke EXECUTE from PUBLIC and `authenticated` — only `service_role`
--     may call it (the admin SQL explorer calls it from the server with the
--     service role, behind the API's isAdmin gate + its own keyword guard),
--   * harden the read-only guard so data-modifying keywords are rejected
--     ANYWHERE in the query, not just as the first word.

DROP FUNCTION IF EXISTS execute_sql(text) CASCADE;

CREATE OR REPLACE FUNCTION execute_sql(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  normalized text;
BEGIN
  normalized := upper(btrim(query_text));

  -- Only allow read-style statements as the first keyword.
  IF NOT (normalized ~ '^[[:space:]]*(SELECT|EXPLAIN|SHOW|DESCRIBE|DESC|WITH)[[:space:](]') THEN
    RAISE EXCEPTION 'Only read-only queries (SELECT, EXPLAIN, SHOW, DESCRIBE, WITH) are allowed';
  END IF;

  -- Reject data-modifying keywords ANYWHERE (covers EXPLAIN ANALYZE <DML> and
  -- data-modifying CTEs such as `WITH x AS (DELETE ...) SELECT ...`).
  IF normalized ~ '(^|[^A-Z_0-9])[[:space:]]*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|CALL|DO|MERGE|COPY|VACUUM|REINDEX|REFRESH|SECURITY)[[:space:]]' THEN
    RAISE EXCEPTION 'Data-modifying statements are not allowed';
  END IF;

  EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t', query_text) INTO result;
  RETURN result;
END;
$$;

-- Only the server-side admin path (service role) may execute raw SQL.
REVOKE ALL ON FUNCTION execute_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION execute_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
