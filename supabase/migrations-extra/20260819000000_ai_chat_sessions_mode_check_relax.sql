-- Relax ai_chat_sessions.mode CHECK constraint to include new mode values.
--
-- The original migration (20260722100000) only allowed
--   'explain', 'quiz', 'generate', 'free'
-- The app's migrateChatMode() now emits 'study' | 'companion', which
-- violates the constraint and causes 400 errors on every upsert.

-- 1. Drop the old constraint
ALTER TABLE public.ai_chat_sessions
  DROP CONSTRAINT IF EXISTS ai_chat_sessions_mode_check;

-- 2. Re-create with the full set of accepted values
ALTER TABLE public.ai_chat_sessions
  ADD CONSTRAINT ai_chat_sessions_mode_check
  CHECK (mode IN ('explain', 'quiz', 'generate', 'free', 'study', 'companion'));

-- 3. Migrate any existing rows that still carry old values
UPDATE public.ai_chat_sessions
   SET mode = 'study'
 WHERE mode IN ('explain', 'quiz', 'generate', 'free');

-- 4. Update schema_migrations
INSERT INTO schema_migrations (version, description)
VALUES ('20260819000000', 'Relax ai_chat_sessions.mode CHECK to include study and companion')
ON CONFLICT (version) DO NOTHING;
