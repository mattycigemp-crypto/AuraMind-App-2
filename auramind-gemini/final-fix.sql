-- Complete fix for all database restrictions (Fixed version)

-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fix foreign key constraints
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_user_id_fkey;
ALTER TABLE decks ADD CONSTRAINT decks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Add user_id to cards table if missing
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 6. Create policies for decks table
DROP POLICY IF EXISTS "Users can view own decks" ON decks;
CREATE POLICY "Users can view own decks" ON decks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own decks" ON decks;
CREATE POLICY "Users can create own decks" ON decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own decks" ON decks;
CREATE POLICY "Users can update own decks" ON decks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own decks" ON decks;
CREATE POLICY "Users can delete own decks" ON decks
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create policies for cards table
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
CREATE POLICY "Users can view own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own cards" ON cards;
CREATE POLICY "Users can create own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON cards;
CREATE POLICY "Users can update own cards" ON cards
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
CREATE POLICY "Users can delete own cards" ON cards
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create user sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);

-- 10. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON decks TO authenticated;  
GRANT ALL ON cards TO authenticated;
GRANT USAGE ON ALL SEQUENCES TO authenticated;

-- 11. Manually insert current user if they exist
-- This will help with the immediate sync
INSERT INTO users (id, email) 
SELECT id, email 
FROM auth.users 
WHERE id = 'a4c893a2-fb6f-4110-8ada-4adfdad4e0d7'
ON CONFLICT (id) DO NOTHING;

SELECT 'Database schema completely fixed!' as status;