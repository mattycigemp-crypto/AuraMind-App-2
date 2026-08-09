-- AuraMind Database Migration: Personalized FSRS Adaptation Weights
-- Date: 2026-07-16
-- Version: 3.4.0
--
-- Per-user FSRS v5 weights that improve on the static defaults. One row
-- per user; lazily computed once their review history crosses the gate
-- threshold (50+ reviews). Tuning writes only when the Brier-style loss
-- beats the global defaults — so a row that exists is always better than
-- the default-seeded baseline.

CREATE TABLE IF NOT EXISTS user_fsrs_params (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weights JSONB NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  accuracy_baseline NUMERIC NOT NULL DEFAULT 0,
  loss_value NUMERIC NOT NULL DEFAULT 0,
  profile_label TEXT,
  last_tuned_at TIMESTAMPTZ DEFAULT NOW(),
  tuning_runs INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE user_fsrs_params ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own FSRS params" ON user_fsrs_params;
CREATE POLICY "Users can read own FSRS params" ON user_fsrs_params
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own FSRS params" ON user_fsrs_params;
CREATE POLICY "Users can insert own FSRS params" ON user_fsrs_params
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own FSRS params" ON user_fsrs_params;
CREATE POLICY "Users can update own FSRS params" ON user_fsrs_params
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The tuner is invoked from `src/services/study/fsrsAdaptation.ts` and
-- writes back through a SECURITY DEFINER RPC so it can do its own
-- transaction (not strictly needed for a single-row UPSERT, but symmetry
-- with `bump_forks_and_unpublish` from migration 20260715).
CREATE OR REPLACE FUNCTION upsert_user_fsrs_params(
  p_user_id UUID,
  p_weights JSONB,
  p_review_count INTEGER,
  p_accuracy_baseline NUMERIC,
  p_loss_value NUMERIC,
  p_profile_label TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'cannot write another user fsrs params' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_fsrs_params (
    user_id, weights, review_count, accuracy_baseline, loss_value, profile_label, last_tuned_at, tuning_runs
  )
  VALUES (p_user_id, p_weights, p_review_count, p_accuracy_baseline, p_loss_value, p_profile_label, NOW(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    weights = EXCLUDED.weights,
    review_count = EXCLUDED.review_count,
    accuracy_baseline = EXCLUDED.accuracy_baseline,
    loss_value = EXCLUDED.loss_value,
    profile_label = EXCLUDED.profile_label,
    last_tuned_at = NOW(),
    tuning_runs = user_fsrs_params.tuning_runs + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_user_fsrs_params(
  UUID, JSONB, INTEGER, NUMERIC, NUMERIC, TEXT
) TO authenticated;

-- Track schema version
INSERT INTO schema_migrations (version, description)
VALUES ('20260716_fsrs_adaptation', 'User-personalized FSRS weights with RPC upsert')
ON CONFLICT (version) DO NOTHING;
