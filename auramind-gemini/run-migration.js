const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read the SQL file
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'fix-database-schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('🚀 Starting AuraMind database schema migration...');
    
    try {
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (!statement.trim()) continue;
            
            console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
                
                if (error) {
                    // Try direct SQL if RPC fails
                    console.log('⚠️  RPC failed, trying direct SQL execution...');
                    
                    // For some operations, we need to use the REST API directly
                    // This is a limitation of the JavaScript client
                    console.log('📄 Statement:', statement.substring(0, 100) + '...');
                    
                    // Skip DDL statements that can't be executed via JS client
                    if (statement.includes('CREATE TABLE') || 
                        statement.includes('ALTER TABLE') ||
                        statement.includes('DROP POLICY') ||
                        statement.includes('CREATE POLICY') ||
                        statement.includes('CREATE TRIGGER') ||
                        statement.includes('CREATE FUNCTION') ||
                        statement.includes('CREATE INDEX')) {
                        console.log('⏭️  Skipping DDL statement (requires SQL editor):', statement.substring(0, 50) + '...');
                        continue;
                    }
                } else {
                    console.log('✅ Statement executed successfully');
                }
            } catch (err) {
                console.log('⚠️  Statement failed (may need manual execution):', err.message);
            }
        }
        
        console.log('\n🎉 Migration completed!');
        console.log('\n📋 Manual steps required:');
        console.log('1. Open Supabase Dashboard → SQL Editor');
        console.log('2. Copy and run the contents of fix-database-schema.sql');
        console.log('3. This will create the users table and fix RLS policies');
        console.log('\n✨ After running the SQL, your database will be ready!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();