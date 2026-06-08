// Simple database initialization script
// This will create the users table entry for the current authenticated user

import { createClient } from '@supabase/supabase-js';

// Read .env file manually
const fs = await import('fs');
const path = await import('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

Object.assign(process.env, envVars);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeDatabase() {
    console.log('🚀 Initializing AuraMind database...');
    
    try {
        // Test connection
        const { data, error } = await supabase.from('decks').select('count').limit(1);
        
        if (error) {
            console.log('⚠️  Database connection test failed:', error.message);
            console.log('💡 This is expected if RLS policies are blocking access');
        } else {
            console.log('✅ Database connection successful');
        }
        
        console.log('\n📋 Next steps to fix database restrictions:');
        console.log('1. Open your Supabase Dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and run this SQL:');
        console.log(`
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix foreign key constraint
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_user_id_fkey;
ALTER TABLE decks ADD CONSTRAINT decks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to cards table if missing
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own decks" ON decks;
CREATE POLICY "Users can view own decks" ON decks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own decks" ON decks;
CREATE POLICY "Users can create own decks" ON decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own cards" ON cards;
CREATE POLICY "Users can view own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own cards" ON cards;
CREATE POLICY "Users can create own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user sync trigger
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
        `);
        
        console.log('\n✨ After running the SQL, refresh your app and the import functionality will work!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    }
}

initializeDatabase();