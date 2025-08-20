import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Read public env (must be set in `.env.local` on dev and in Vercel Project → Settings → Environment Variables)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // In production this will crash early and tell you what's wrong;
  // in dev you can switch this to console.warn if you prefer.
  throw new Error(
    '[supabase] Missing env. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/** Single shared client instance */
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export default supabase;