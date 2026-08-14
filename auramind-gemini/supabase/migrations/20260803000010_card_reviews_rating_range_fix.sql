-- Relax card_reviews rating CHECK + record_card_review bound to FSRS v5.
--
-- StudyModePage.tsx calls recordReview() with the full FSRS v5 `Rating`
-- enum: AGAIN=0, HARD=3, GOOD=4, EASY=5 (src/types/index.ts). The table
-- still carried the old CHECK (rating >= 0 AND rating <= 4) from migration
-- 20260717, so every EASY (=5) review was rejected with 23514 and silently
-- dropped by the fire-and-forget catch in StudyModePage — leaving
-- SessionReplayModal without entries for exactly the reviews the user
-- nailed. The code comment referenced a `20260724000000_card_reviews_rating_range_fix`
-- migration that was never actually created; this migration is that fix.

-- 1. Relax the table CHECK: rating >= 0 (upper bound removed).
ALTER TABLE public.card_reviews DROP CONSTRAINT IF EXISTS card_reviews_rating_check;
ALTER TABLE public.card_reviews
  ADD CONSTRAINT card_reviews_rating_check CHECK (rating >= 0);

-- 2. Align the SECURITY DEFINER RPC with the same bound (was 0..4).
CREATE OR REPLACE FUNCTION public.record_card_review(
  p_user_id uuid DEFAULT NULL,
  p_card_id uuid DEFAULT NULL,
  p_rating integer DEFAULT NULL,
  p_srs_result jsonb DEFAULT '{}'::jsonb,
  p_srs_algorithm text DEFAULT 'fsrs',
  p_reviewed_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_uid uuid;
  v_owned boolean;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'caller cannot review for another user' USING ERRCODE = '42501';
  END IF;

  IF p_card_id IS NULL OR p_rating IS NULL THEN
    RAISE EXCEPTION 'card_id and rating are required' USING ERRCODE = '22023';
  END IF;

  -- FSRS v5 surface: 0..5 (AGAIN..EASY). Negative is always invalid.
  IF p_rating < 0 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating out of range 0..5' USING ERRCODE = '23514';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM cards c
    JOIN decks d ON d.id = c.deck_id
    WHERE c.id = p_card_id
      AND (
        c.user_id = v_uid
        OR d.user_id = v_uid
        OR EXISTS (
          SELECT 1
          FROM shared_decks sd
          WHERE sd.deck_id = d.id
            AND sd.accepted = true
            AND sd.accepted_by = v_uid
        )
      )
  ) INTO v_owned;

  IF NOT v_owned THEN
    RAISE EXCEPTION 'card not found or not accessible to caller' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO card_reviews (
    user_id, card_id, rating, srs_result, srs_algorithm, reviewed_at, synced_at
  )
  VALUES (
    v_uid, p_card_id, p_rating, p_srs_result, p_srs_algorithm, p_reviewed_at, now()
  )
  ON CONFLICT (card_id) DO UPDATE
  SET rating       = EXCLUDED.rating,
      srs_result   = EXCLUDED.srs_result,
      srs_algorithm = EXCLUDED.srs_algorithm,
      reviewed_at  = EXCLUDED.reviewed_at,
      synced_at    = now();
END;
$func$;

REVOKE ALL ON FUNCTION public.record_card_review(uuid, uuid, integer, jsonb, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_card_review(uuid, uuid, integer, jsonb, text, timestamptz) TO authenticated;
