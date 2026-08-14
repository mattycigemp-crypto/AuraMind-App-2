import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Some features may not work properly.');
}

/**
 * The Supabase client, or `null` when the environment variables are absent.
 *
 * Prefer `requireSupabase()` in service code. Use this nullable export only
 * where the caller genuinely handles the unconfigured case (feature
 * detection, optional analytics, boot-time diagnostics).
 */
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** True when both Supabase env vars were present at startup. */
export const isSupabaseConfigured = supabase !== null;

/**
 * Returns the Supabase client, throwing a clear, actionable error when it
 * is not configured.
 *
 * Without this, a missing env var surfaces as "Cannot read properties of
 * null (reading 'from')" from deep inside an unrelated query chain. Every
 * data-access path in the app requires a client, so failing loudly at the
 * call site is both safer and far easier to diagnose.
 */
export function requireSupabase(): SupabaseClient {
    if (!supabase) {
        throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and ' +
            'VITE_SUPABASE_ANON_KEY in your environment (.env.local locally, ' +
            'Project Settings → Environment Variables on Vercel).',
        );
    }
    return supabase;
}
