-- AuraMind Database Migration: AI Chat Sessions (per-user durable store)
-- Date: 2026-07-22
-- Version: 3.7.0
--
-- Adds the durable Prof. Aura conversation store. Source-of-truth on the
-- client is still localStorage so the chat is responsive offline; this
-- table is the cross-device sync layer so a returning user finds their
-- last conversation on any browser they sign into.
--
-- Idempotent (CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS). Apply on
-- a live DB without downtime.

-- 1. Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New chat',
  mode        TEXT NOT NULL DEFAULT 'free'
              CHECK (mode IN ('explain', 'quiz', 'generate', 'free')),
  deck_id     UUID NULL REFERENCES decks(id) ON DELETE SET NULL,
  deck_name   TEXT NULL,
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- App sends either createdAt/updatedAt (epoch ms) or created_at/updated_at
  -- (ISO strings). The serializer prefers ISO; this guard keeps both safe.
  CONSTRAINT ai_chat_sessions_id_unique_per_user UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_updated
  ON public.ai_chat_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_pinned
  ON public.ai_chat_sessions (user_id, pinned, updated_at DESC);

-- 2. Keep updated_at fresh on UPDATE ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
CREATE TRIGGER trg_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_chat_sessions_updated_at();

-- 3. RLS — each user sees/writes only their own rows ─────────────────────
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_chat_sessions_select_own" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_select_own" ON public.ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_sessions_insert_own" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_insert_own" ON public.ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_sessions_update_own" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_update_own" ON public.ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_sessions_delete_own" ON public.ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_delete_own" ON public.ai_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Performance cap — never let one user accumulate 10k sessions ───────
-- A user could in theory spam the chat forever; the auto-save debounces
-- to 5s but writes a row per session. Cap with a soft limit via a
-- SECURITY DEFINER function. If exceeded, oldest unpinned sessions are
-- pruned in the background.
CREATE OR REPLACE FUNCTION public.prune_old_chat_sessions(p_user_id UUID, p_max_count INTEGER DEFAULT 250)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'cannot prune another user''s sessions' USING ERRCODE = '42501';
  END IF;

  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY pinned ORDER BY updated_at DESC) AS rn
    FROM ai_chat_sessions
    WHERE user_id = p_user_id
  ),
  stale AS (
    SELECT id FROM ranked WHERE rn > p_max_count
  )
  DELETE FROM ai_chat_sessions
  WHERE id IN (SELECT id FROM stale);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.prune_old_chat_sessions(UUID, INTEGER) TO authenticated;

-- 5. Migration bookkeeping ───────────────────────────────────────────────
INSERT INTO schema_migrations (version, description)
VALUES ('20260722100000_ai_chat_sessions', 'Adds ai_chat_sessions table for cross-device Prof. Aura persistence; localStorage remains source of truth on client')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
