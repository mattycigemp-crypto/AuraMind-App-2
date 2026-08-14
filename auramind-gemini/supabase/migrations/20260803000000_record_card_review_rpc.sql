-- record_card_review RPC — the write-side path for card reviews used by
-- cardReviewsService.recordReview() (online StudyModePage) and
-- offlineStudyService.syncOfflineData() (offline queue flush).
--
-- This function was referenced by both services since M7 but was never
-- created in a migration, so every review RPC call failed with PGRST202
-- (function not found), leaving `card_reviews` empty and SessionReplayModal
-- with no data to step through.
--
-- Design:
--   * SECURITY DEFINER so the upsert bypasses the 1-hour UPDATE RLS window
--     (reviewed_at > now() - interval '1 hour') that blocked re-grades.
--   * Caller validation: auth.uid() must own the card (cards.user_id),
--     own the deck, or be an accepted sharee (shared_decks).
--   * p_user_id is optional — the offline queue intentionally omits it and
--     lets server-side auth.uid() populate the row owner.
--   * ON CONFLICT (card_id) DO UPDATE — one review row per card, latest
--     rating wins (card_reviews.card_id has a UNIQUE constraint).

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
  -- Resolve the reviewer: explicit p_user_id (must match the caller) or
  -- auth.uid() for offline-queue submissions that omit it.
  v_uid := COALESCE(p_user_id, auth.uid());
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'caller cannot review for another user' USING ERRCODE = '42501';
  END IF;

  -- Required inputs: card + rating.
  IF p_card_id IS NULL OR p_rating IS NULL THEN
    RAISE EXCEPTION 'card_id and rating are required' USING ERRCODE = '22023';
  END IF;

  -- Rating bound check (mirrors the card_reviews_rating_check CHECK).
  IF p_rating < 0 OR p_rating > 4 THEN
    RAISE EXCEPTION 'rating out of range 0..4' USING ERRCODE = '23514';
  END IF;

  -- Ownership: direct card owner, deck owner, or accepted sharee.
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

-- Keep the RPC callable by the app role only.
REVOKE ALL ON FUNCTION public.record_card_review(uuid, uuid, integer, jsonb, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_card_review(uuid, uuid, integer, jsonb, text, timestamptz) TO authenticated;
