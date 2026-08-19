-- ============================================================================
-- STATUS: NOT APPLIED — REQUIRES supabase_admin (run in the Supabase SQL editor)
-- ============================================================================
--
-- CRITICAL: unauthenticated SSRF. The pgsql-http extension installs these
-- functions into the `public` schema and grants EXECUTE to PUBLIC, so the
-- anonymous `anon` role can call /rest/v1/rpc/http_get and make the database
-- issue arbitrary outbound HTTP requests (cloud-metadata probing, internal
-- port scanning, response exfiltration). Verified: anon http_get('https://…')
-- returns the full response body.
--
-- The linked CLI runs as `postgres` (rolsuper=false), which CANNOT revoke
-- grants made by `supabase_admin` (the only superuser). Paste this into the
-- Supabase Dashboard SQL editor (which runs as a privileged role) instead.
--
-- The app's only outbound-HTTP path is net.http_post (pg_net), so revoking
-- the public http_* functions is safe. No schema_migrations bookkeeping is
-- inserted here on purpose — do not add one until it has actually run.

REVOKE ALL ON FUNCTION public.http(http_request) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_delete(character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_delete(character varying, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_get(character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_get(character varying, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_head(character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_header(character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_list_curlopt() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_patch(character varying, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_post(character varying, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_post(character varying, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_put(character varying, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_reset_curlopt() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.http_set_curlopt(character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.urlencode(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.urlencode(bytea) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.urlencode(character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.text_to_bytea(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bytea_to_text(bytea) FROM PUBLIC, anon, authenticated;
