-- AuraMind Database Migration: FSRS & Fact-Checking Support
-- Run this in your Supabase SQL Editor to add new columns for FSRS algorithm and card verification
-- Date: 2026-05-21
-- Version: 2.0.0

-- Add FSRS state column to cards table (stores JSON with stability, difficulty, etc.)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS fsrs_state JSONB;

-- Add verified column for AI fact-check results
ALTER TABLE cards ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add index on fsrs_state for analytics queries
CREATE INDEX IF NOT EXISTS idx_cards_fsrs_state ON cards USING GIN (fsrs_state);

-- Add index on verified for filtering verified/unverified cards
CREATE INDEX IF NOT EXISTS idx_cards_verified ON cards (verified);

-- Add SRS columns (may not exist if table was created with front/back instead of README schema)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS next_review TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS ease_factor NUMERIC DEFAULT 2.5;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS repetition INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0;

-- Add updated_at column for tracking card modifications
ALTER TABLE cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add study_preferences column to user_profiles for FSRS customization
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS study_preferences JSONB DEFAULT '{"requestRetention": 0.9, "maximumInterval": 36500, "newCardsPerDay": 20, "reviewsPerDay": 200}'::jsonb;

-- Add fact_check_history table for tracking verification results
CREATE TABLE IF NOT EXISTS fact_check_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    verified BOOLEAN NOT NULL,
    confidence NUMERIC DEFAULT 0,
    issues JSONB,
    suggestions JSONB,
    sources JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on fact_check_history
ALTER TABLE fact_check_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for fact_check_history
CREATE POLICY "Users can view own fact check history" ON fact_check_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fact check history" ON fact_check_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add index for querying fact check history by card
CREATE INDEX IF NOT EXISTS idx_fact_check_card ON fact_check_history (card_id);

-- Add index for querying fact check history by user
CREATE INDEX IF NOT EXISTS idx_fact_check_user ON fact_check_history (user_id);

-- Create view for card analytics with FSRS data
CREATE OR REPLACE VIEW card_analytics AS
SELECT
    c.id,
    c.deck_id,
    c.user_id,
    c.front AS question,
    c.back AS answer,
    c.interval,
    c.ease_factor,
    c.repetition,
    c.last_reviewed,
    c.verified,
    c.fsrs_state,
    c.source_type,
    c.trust_score,
    CASE
        WHEN c.fsrs_state IS NOT NULL THEN 'fsrs'
        ELSE 'sm2'
    END AS srs_algorithm,
    CASE
        WHEN c.repetition = 0 THEN 'new'
        WHEN c.interval <= 21 THEN 'learning'
        ELSE 'mature'
    END AS card_stage,
    CASE
        WHEN c.next_review IS NULL THEN 'not_due'
        WHEN c.next_review <= NOW() THEN 'due'
        WHEN c.next_review <= NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'not_due'
    END AS review_status
FROM cards c;

-- Grant access to the view
GRANT SELECT ON card_analytics TO authenticated;

-- Add migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Record this migration
INSERT INTO schema_migrations (version, description)
VALUES ('20260521_fsrs_factcheck', 'Add FSRS support, fact-checking, and analytics improvements')
ON CONFLICT (version) DO NOTHING;

-- Migration complete
-- To verify: SELECT * FROM schema_migrations ORDER BY applied_at DESC;
