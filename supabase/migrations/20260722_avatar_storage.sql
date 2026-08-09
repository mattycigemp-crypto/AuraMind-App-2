-- AuraMind Database Migration: Avatar Storage Bucket
-- Date: 2026-07-22
-- Version: 3.7.1
--
-- Adds the `avatars` Supabase Storage bucket + RLS so users can upload
-- their own profile picture (PNG / JPG / WEBP / SVG / GIF). The user
-- profile's `avatar_url` slot then mirrors the public URL of the object
-- at `avatars/{user_id}/profile.{ext}` so the AppShell sidebar's
-- <ProfAuraAvatar> component renders <img src={avatar_url}> directly
-- without server-side transcoding.
--
-- RLS rules:
--   - INSERT/UPDATE/DELETE: only on objects whose folder name equals auth.uid()
--     so a user can only write to their own folder.
--   - SELECT: any authenticated user can read any avatar (avatars are
--     intentionally public-ish for social features in the future).

-- ============================================================
-- 1. The bucket itself. Idempotent — bucket creation is safe to repeat.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,                              -- public-read so CDN can cache the URL
  5242880,                           -- 5 MiB per object (matches AuraMind intake cap)
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/avif'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit     = EXCLUDED.file_size_limit,
      allowed_mime_types  = EXCLUDED.allowed_mime_types,
      public              = EXCLUDED.public;

-- ============================================================
-- 2. RLS policies on storage.objects
-- ============================================================
--
-- Path layout: avatars/{user_id}/{filename}
-- The first path segment after `avatars/` is treated as owner id.

-- Authenticated users can READ any avatar object. Public-read is also
-- enabled at the bucket level so unauthenticated browsing renders correctly
-- for marketing-page embeds.
DROP POLICY IF EXISTS "Avatar objects are publicly readable" ON storage.objects;
CREATE POLICY "Avatar objects are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can UPLOAD only to their own folder. We extract the
-- second path segment (the user_id) using `storage.foldername(name)[2]`
-- because foldername() returns an array indexed from 1.
DROP POLICY IF EXISTS "Users can upload avatars to their own folder" ON storage.objects;
CREATE POLICY "Users can upload avatars to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Replace-object: same owner rule as the insert path.
DROP POLICY IF EXISTS "Users can update avatars in their own folder" ON storage.objects;
CREATE POLICY "Users can update avatars in their own folder" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Delete:
DROP POLICY IF EXISTS "Users can delete avatars in their own folder" ON storage.objects;
CREATE POLICY "Users can delete avatars in their own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- ============================================================
-- 3. avatar_upload_secure RPC
--    Optional convenience entry point: validates the requested filename's
--    mime list and returns the RELATIVE storage path. The client constructs
--    the absolute public URL via `supabase.storage.from('avatars').getPublicUrl()`,
--    so we never need to know the project URL server-side.
--    Returns NULL on invalid mime so the client can surface a friendly error.
-- ============================================================
CREATE OR REPLACE FUNCTION avatar_upload_secure(
  p_filename TEXT,
  p_mime_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, storage
AS $$
DECLARE
  v_safe_mime TEXT := LOWER(COALESCE(p_mime_type, ''));
  v_safe_name TEXT := REGEXP_REPLACE(p_filename, '[^a-zA-Z0-9._-]', '_', 'g');
BEGIN
  IF v_safe_mime NOT IN (
    'image/png','image/jpeg','image/jpg','image/webp',
    'image/svg+xml','image/gif','image/avif'
  ) THEN
    RETURN NULL;
  END IF;

  -- Relative path only. The Supabase JS client knows the project URL and
  -- bucket base path; concatenating server-side was historically fragile
  -- because `current_setting('app.settings.supabase_url')` is not populated.
  RETURN format('%s/%s', auth.uid()::text, v_safe_name);
END;
$$;
GRANT EXECUTE ON FUNCTION avatar_upload_secure(TEXT, TEXT) TO authenticated;

-- ============================================================
-- Migration bookkeeping
-- ============================================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260722_avatar_storage',
        'Adds avatars storage bucket with per-user RLS + avatar_upload_secure helper RPC')
ON CONFLICT (version) DO NOTHING;
