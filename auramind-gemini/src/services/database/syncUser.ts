import { supabase } from './supabase';

let hasSyncedForSession = false;

/**
 * Sync the current authenticated user to the users table
 * This fixes the foreign key constraint issue
 */
export async function syncCurrentUser(): Promise<boolean> {
  if (hasSyncedForSession) return true;
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user found:', authError);
      return false;
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Not "not found" error
      console.error('Error checking existing user:', checkError);
      return false;
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return false;
      }
    }

    hasSyncedForSession = true;
    return true;
  } catch (error) {
    console.error('Error syncing user:', error);
    return false;
  }
}

/**
 * Ensure user is synced before database operations
 */
export async function ensureUserSynced(): Promise<void> {
  const synced = await syncCurrentUser();
  if (!synced) {
    throw new Error('Failed to sync user to database. Cannot proceed with database operations.');
  }
}


