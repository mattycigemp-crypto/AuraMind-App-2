-- Placeholder for remote-only migration 20260725000000.
-- Applied directly on the remote project; kept as an empty file so the local
-- migrations directory matches the remote's applied migration versions.

INSERT INTO schema_migrations (version, description)
VALUES (
  '20260725000000_remote_only',
  'Placeholder reconciling remote-only migration 20260725000000'
)
ON CONFLICT (version) DO NOTHING;
