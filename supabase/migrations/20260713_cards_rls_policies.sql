-- AuraMind Database Migration: Cards RLS Policies
-- Date: 2026-07-13
-- Version: 3.2.0
--
-- Fixes PGRST116 "Cannot coerce the result to a single JSON object"
-- caused by missing UPDATE (and possibly DELETE) RLS policies on the cards table.

-- Ensure RLS is enabled on cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read only their own cards
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
CREATE POLICY "Users can view own cards" ON cards
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create cards for themselves
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
CREATE POLICY "Users can insert own cards" ON cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update only their own cards
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
CREATE POLICY "Users can update own cards" ON cards
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete only their own cards
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
CREATE POLICY "Users can delete own cards" ON cards
  FOR DELETE USING (auth.uid() = user_id);

-- Record migration
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_migrations (version, description)
VALUES ('20260713_cards_rls_policies', 'Add RLS policies for cards table CRUD operations')
ON CONFLICT (version) DO NOTHING;
