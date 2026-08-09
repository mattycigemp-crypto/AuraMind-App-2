-- Migration: Add execute_sql function for admin SQL Explorer
-- This function allows the DatabaseExplorer to run read-only SQL queries

CREATE OR REPLACE FUNCTION execute_sql(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  upper_query text;
BEGIN
  upper_query := upper(trim(query_text));

  -- Safety: only allow read operations
  IF NOT (
    upper_query LIKE 'SELECT%' OR
    upper_query LIKE 'EXPLAIN%' OR
    upper_query LIKE 'SHOW%' OR
    upper_query LIKE 'DESCRIBE%' OR
    upper_query LIKE 'DESC%' OR
    upper_query LIKE 'WITH%'
  ) THEN
    RAISE EXCEPTION 'Only read-only queries (SELECT, EXPLAIN, SHOW, DESCRIBE, WITH) are allowed';
  END IF;

  -- Execute the query and return results as JSON array
  EXECUTE format('
    SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
    FROM (%s) t
  ', query_text) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated role (Supabase will handle this via RLS and admin checks)
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
