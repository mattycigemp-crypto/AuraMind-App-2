-- Fix AuraMind Database Schema Issues
-- This script resolves foreign key constraints and RLS policies

-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fix decks table - ensure proper columns and constraints
-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'decks_user_id_fkey' 
        AND table_name = 'decks'
    ) THEN
        ALTER TABLE decks DROP CONSTRAINT decks_user_id_fkey;
    END IF;
END $$;

-- Add proper foreign key constraint with ON DELETE CASCADE
ALTER TABLE decks 
ADD CONSTRAINT decks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Fix cards table - add user relationship if missing
-- Check if user_id column exists in cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cards' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE cards ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Add foreign key constraint for cards.user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cards_user_id_fkey' 
        AND table_name = 'cards'
    ) THEN
        ALTER TABLE cards 
        ADD CONSTRAINT cards_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create or update RLS policies to allow authenticated users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own decks" ON decks;
DROP POLICY IF EXISTS "Users can create own decks" ON decks;
DROP POLICY IF EXISTS "Users can update own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON decks;

DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can create own cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;

-- Enable RLS if not already enabled
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "Users can view own decks" ON decks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decks" ON decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks" ON decks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks" ON decks
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON cards
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create trigger to automatically create user record when they first sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update existing cards to have user_id if they're missing
UPDATE cards 
SET user_id = (
    SELECT d.user_id 
    FROM decks d 
    WHERE d.id = cards.deck_id
    LIMIT 1
) 
WHERE user_id IS NULL AND deck_id IS NOT NULL;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);

-- 8. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON decks TO authenticated;  
GRANT ALL ON cards TO authenticated;
GRANT USAGE ON ALL SEQUENCES TO authenticated;

-- 9. Verify setup
SELECT 'Database schema fixed successfully!' as status;