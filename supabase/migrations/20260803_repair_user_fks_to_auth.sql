-- AuraMind Database Migration: Repair user FKs to auth.users + drop legacy users mirror
-- Date: 2026-08-03
--
-- Root cause: decks.user_id, cards.user_id and user_profiles.id still FK to
-- the legacy `users` mirror table (deprecated in M6.5.b, never dropped;
-- 197 of its 200 rows were stale junk not present in auth.users). GoTrue's
-- native user_profiles sync and src/services/database/syncUser.ts both write
-- rows keyed by the auth.users id, so every NEW user hit:
--
--   23503 ... violates foreign key constraint "user_profiles_id_fkey" ...
--           Key (id)=(...) is not present in table "users".
--
-- New signups returned HTTP 500 and no profile/deck/card could be created
-- for them. Fix: repoint all three FKs at auth.users(id) — the actual source
-- of truth (syncUser.ts has upserted there since M6.5.b) — and drop the dead
-- mirror per the M6.5.b plan ("once no caller references it").
--
-- Idempotent: safe to re-run against a DB where this is already applied.

-- 1. Orphan guard: profile rows whose id is not a real auth user would
--    block the new constraint. None existed at apply time; kept as a guard.
DELETE FROM user_profiles up
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = up.id);

-- 2. Repoint FKs at auth.users (guarded — Postgres has no
--    ADD CONSTRAINT IF NOT EXISTS, so check pg_constraint first).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_id_fkey'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'decks_user_id_fkey'
  ) THEN
    ALTER TABLE decks
      ADD CONSTRAINT decks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cards_user_id_fkey'
  ) THEN
    ALTER TABLE cards
      ADD CONSTRAINT cards_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 3. Drop the dead mirror (M6.5.b intent; no FK/code/function/view references remain).
DROP TABLE IF EXISTS users;

-- 4. Remove the legacy dashboard-template trigger that wrote to the dropped
--    mirror (public.handle_new_user → INSERT INTO public.users). Profile
--    creation is owned by src/services/database/syncUser.ts (upsert on
--    user_id) and the role-sync trigger below.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- 5. Fix sync_auth_role_to_profiles (from 20260724000020): it inserted rows
--    WITHOUT id, letting the gen_random_uuid() default fire — so
--    user_profiles.id drifted from auth.users.id and the app's
--    `.eq('id', user.id)` profile updates (App.tsx, SettingsPage) silently
--    matched nothing. Write id = auth id and converge on user_id conflicts.
CREATE OR REPLACE FUNCTION public.sync_auth_role_to_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data ->> 'role';
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.user_profiles (id, user_id, role)
  VALUES (NEW.id, NEW.id, v_role)
  ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, id = EXCLUDED.id;

  RETURN NEW;
END;
$function$;

-- 6. Backfill: align any existing random-id profile rows with the auth id
--    (rows created by the pre-fix trigger between 20260724000020 and now).
UPDATE user_profiles up
SET id = up.user_id
WHERE up.user_id IS NOT NULL
  AND up.id IS DISTINCT FROM up.user_id
  AND NOT EXISTS (SELECT 1 FROM user_profiles other WHERE other.id = up.user_id);

-- 7. Self-register (repo convention since 20260713).
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260803_repair_user_fks_to_auth',
  'Repoint user FKs to auth.users; drop legacy users mirror; fix role-sync id'
)
ON CONFLICT (version) DO NOTHING;
