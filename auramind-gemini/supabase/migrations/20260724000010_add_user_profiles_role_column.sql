-- Add role column to user_profiles for client-side role resolution
-- The auth metadata role is the primary source, but this column serves as
-- a fallback for the syncSession cross-check in App.tsx.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Set owner role for known admin accounts
UPDATE public.user_profiles SET role = 'owner' WHERE user_id = 'a4c893a2-fb6f-4110-8ada-4adfdad4e0d7';
UPDATE public.user_profiles SET role = 'owner' WHERE user_id = '90ca413c-c4ce-47be-9ae9-0ae60474708c';

INSERT INTO schema_migrations (version, description)
VALUES ('20260724000010_add_user_profiles_role_column',
        'Adds role text column to user_profiles for client-side role resolution; sets owner for known admin accounts')
ON CONFLICT (version) DO NOTHING;
