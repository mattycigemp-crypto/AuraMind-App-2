-- Probe study_sessions FK state + decks column names so we know what
-- schema fix to apply. Read-only.

-- 1) Foreign keys targeting decks / study_sessions
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')' AS references
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('study_sessions', 'decks')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 2) Direct: does study_sessions.deck_id have *any* FK out?
SELECT EXISTS (
  SELECT 1 FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
   JOIN information_schema.constraint_column_usage ccu
     ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'study_sessions'
    AND kcu.column_name = 'deck_id'
    AND ccu.table_name = 'decks'
) AS study_sessions_deck_id_points_at_decks;

-- 3) Which "label" column does decks expose?
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'decks'
  AND column_name IN ('title', 'name', 'display_name', 'deck_name')
ORDER BY column_name;

-- 4) Confirm list_admin_users_secure is publicly resolvable
SELECT proname, prosecdef, prorettype::regtype
FROM pg_proc
WHERE proname IN ('list_admin_users_secure', 'current_user_is_admin');

-- 5) Confirm granted to authenticated
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('list_admin_users_secure', 'current_user_is_admin')
ORDER BY routine_name, grantee;
