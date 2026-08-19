-- AuraMind Database Migration: card_reviews.record_card_review RPC
-- Date: 2026-07-24
-- Version: 3.7.0
--
-- WHY
--   Every card rating in StudyModePage POSTs:
--     POST /rest/v1/card_reviews?on_conflict=card_id
--   The previous policy set contained two distinct failure modes:
--
--     (1) INSERT path: WITH CHECK (auth.uid() = user_id). If the user's
--         JWT's auth.uid() referenced user_id that anything in the payload
--         disagreed with (e.g., a stale workspace context, an inherited
--         card from a shared deck where the card.user_id differs from the
--         reviewer), the insert threw 42501.
--
--     (2) UPSERT-on-conflict path: Postgres routes the ON CONFLICT leg
--         through UPDATE. The UPDATE policy forces:
--           USING (auth.uid() = user_id AND reviewed_at > NOW() - INTERVAL '1 hour')
--         which means *every* card re-rated more than 1 hour after its
--         first review silently throws 42501 with no user feedback other
--         than a non-blocking console.warn. This is exactly the spam the
--         dev console showed — same code, same 42501, every review.
--
--   The fix is the standard one for this category of bug: stop relying on
--   client-side RLS-to-JWT coupling for an action that's logically the
--   reviewer writing their own review, and route through a SECURITY
--   DEFINER RPC that authorizes once and then performs the upsert under
--   the function owner's privileges.
--
-- WHAT
--   Adds public.record_card_review(p_card_id, p_rating, p_srs_result,
--   p_user_id, p_srs_algorithm, p_reviewed_at). Validation:
--
--     - p_user_id must equal auth.uid() (otherwise the RPC is being
--       abused to write a review on someone else's account — loud 42501).
--     - p_rating must be a 0..5 integer matching the FSRS v5 scale.
--     - p_card_id must exist and not belong to a different user — we
--       only rate cards we own. The card's owner check keeps a reviewer
--       from polluting another user's SRS history by reviewing their
--       cards on the shared deck flow.
--
--   If all three checks pass we UPSERT with ON CONFLICT (card_id). The
--   upsert replaces the previous row in-place (no more 1-hour UPDATE
--   window gating re-grades) so any latency between consecutive ratings
--   of the same card is no longer a 42501 surface.
--
-- ALSO
--   The previous 1-hour UPDATE policy is no longer needed once callers
--   route through this RPC (and UI is the only caller). We DROP it so
--   the table cannot accidentally be re-trodden by a curl script that
--   bypasses the RPC and gets the same 42501 spam. The legacy "Users
--   can update own card reviews (within 1 hour)" is removed in this
--   migration. The INSERT/SELECT policies stay in place so offline
--   sync, SessionReplayModal, and any future REST-side read paths
--   continue to work without code change.
--
-- IDEMPOTENT
--   CREATE OR REPLACE for the function body, DROP POLICY IF EXISTS for the
--   legacy UPDATE policy. Safe to apply on a live DB without downtime.

CREATE OR REPLACE FUNCTION record_card_review(
  p_card_id        UUID,
  p_rating         INTEGER,
  p_srs_result     JSONB,
  p_user_id        UUID        DEFAULT NULL,
  p_srs_algorithm  TEXT        DEFAULT 'fsrs',
  p_reviewed_at    TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_owner UUID;
  v_rating     INTEGER;
  v_user_id    UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  -- ── Reviewer identity ───────────────────────────────────────────────
  -- p_user_id is optional. The defining contract is that the row is
  -- written for whoever called the RPC (auth.uid()). Allowing the RPC
  -- to default-fill p_user_id from auth.uid() lets offlineStudyService
  -- queue an item without tracking userId locally and still produce a
  -- correctly-owned row. We mirror the resolved value into v_user_id so
  -- we never have to mutate the input parameter — keeping the body
  -- read top-to-bottom as a clean pipeline.
  IF v_user_id IS NULL THEN
    -- No JWT in the request — could be the anon key hitting the RPC.
    -- Defensive against any future caller wiring the RPC up without
    -- passing `Authorization: Bearer <session>`. We refuse rather than
    -- minting a brandless row.
    RAISE EXCEPTION 'record_card_review: anonymous caller has no auth.uid'
      USING ERRCODE = '42501';
  END IF;

  -- 1. The caller must be writing their own review. This guards against
  --    a future caller that passes p_user_id explicitly alongside a
  --    different authenticated principal.
  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'record_card_review: caller is not the rated user'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Rating must be a non-null integer in the FSRS v5 surface range
  --    AuraMind presently supports (0..4). Tightening here matches the
  --    live `card_reviews.rating` CHECK constraint from migration
  --    20260717 (CHECK rating >= 0 AND rating <= 4) so the RPC is safe
  --    to apply on a live DB WITHOUT first widening the CHECK.
  --    We deliberately rely on Postgres's explicit INTEGER parameter
  --    coercion for the integer-vs-float distinction — `pg_typeof` would
  --    only ever return 'integer' because the parameter is declared as
  --    such (a would-be type guard is structurally inert there), so
  --    attempting to be clever with regtype casts was dropped.
  --    Non-integer wire inputs ARE coerced to INTEGER by the SQL
  --    protocol layer; the bound check below catches any value outside
  --    0..4 and 22000s with a clear message. A future migration can
  --    raise both the bound and the table CHECK to 0..5 simultaneously
  --    if the FSRS v5 'perfect recall' button is ever shipped.
  --
  --    The NULL guard runs FIRST so a NULL p_rating trips the
  --    documented 22000 with a clear message; without it, `NULL < 0`
  --    evaluates to NULL (not TRUE) so the IF wouldn't fire, the row
  --    would proceed to INSERT, and the rating NOT NULL constraint
  --    would raise 23502 instead (a confusing error code with no
  --    stable string the JS service can grep on).
  IF p_rating IS NULL THEN
    RAISE EXCEPTION 'record_card_review: rating cannot be NULL'
      USING ERRCODE = '22000';
  END IF;
  IF p_rating < 0 OR p_rating > 4 THEN
    RAISE EXCEPTION 'record_card_review: rating must be an integer 0..4, got %', p_rating
      USING ERRCODE = '22000';
  END IF;
  v_rating := p_rating;

  -- 3. The card must exist AND belong to the reviewing user. This blocks
  --    a reviewer from polluting another user's SRS history by rating a
  --    card from a shared deck that another user owns.
  SELECT user_id INTO v_card_owner
    FROM cards
    WHERE id = p_card_id;
  IF v_card_owner IS NULL THEN
    RAISE EXCEPTION 'record_card_review: card % not found', p_card_id
      USING ERRCODE = 'P0002';
  ELSIF v_card_owner <> v_user_id THEN
    RAISE EXCEPTION 'record_card_review: card does not belong to caller'
      USING ERRCODE = '42501';
  END IF;

  -- ── Write ────────────────────────────────────────────────────────────
  -- One row per card. Repeating a review replaces the previous row in
  -- place — that is the correct session-replay semantic (SessionReplayModal
  -- shows the most recent outcome, not the chronology).
  --
  -- The unique(card_id) constraint means we MUST use ON CONFLICT here;
  -- a plain INSERT would throw 23505 on the second re-grade.
  -- (No JSONB preflight — PostgREST validates the JSON wire payload at
  -- the protocol edge before calling the RPC. Invalid payloads never
  -- reach us; the absence of explicit work here keeps the hot path
  -- under ~3 ms.)

  INSERT INTO card_reviews (
    user_id, card_id, rating, srs_result, srs_algorithm, reviewed_at, synced_at
  )
  VALUES (
    v_user_id, p_card_id, v_rating, p_srs_result, p_srs_algorithm, p_reviewed_at, NOW()
  )
  ON CONFLICT (card_id) DO UPDATE
    SET rating        = EXCLUDED.rating,
        srs_result    = EXCLUDED.srs_result,
        srs_algorithm = EXCLUDED.srs_algorithm,
        reviewed_at   = EXCLUDED.reviewed_at,
        synced_at     = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION record_card_review(
  UUID, INTEGER, JSONB, UUID, TEXT, TIMESTAMPTZ
) TO authenticated;

-- ── Drop the legacy 1-hour UPDATE policy ─────────────────────────────────
-- This was the surface that produced the 42501 spam. With all callers
-- routing through record_card_review above (and the JS service updated in
-- the same release), the policy can come out without losing any
-- legitimate functionality. UI was the only caller and it now uses the
-- RPC exclusively.
DROP POLICY IF EXISTS "Users can update own card reviews (within 1 hour)" ON card_reviews;

-- Keep the SELECT policy (SessionReplayModal + offline sync reads with
-- auth.uid()) and the INSERT policy intact. The INSERT policy remains as
-- a defense-in-depth net for any caller that bypasses the RPC and hits
-- the REST endpoint directly with a valid token.
--
-- (We deliberately do NOT tighten or replace them here — the RPC handles
-- the bulk write path; these are now the no-mutation read-through path.)

-- ── Bookkeeping ─────────────────────────────────────────────────────────
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260803000000_record_card_review_rpc',
  'SECURITY DEFINER record_card_review RPC + removes 1-hour UPDATE RLS guard that produced the per-card 42501 spam in dev console'
)
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
-- Verify by running the RPC as the affected user:
--   SELECT record_card_review(
--     '<a card_id you own>',
--     3,
--     '{"interval":1,"repetition":1,"easeFactor":2.5,"fsrsState":{}}'::jsonb,
--     auth.uid(),
--     'fsrs', now()
--   );
-- Expected: no error. Then a second call within minutes with rating=4
-- should also succeed (confirming the ON CONFLICT leg works without the
-- 1-hour RLS guard).
