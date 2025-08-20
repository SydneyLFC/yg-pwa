import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Read public env (must be defined in `.env.local` and on Vercel)
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anon) {
  // Fail early in prod, warn in dev
  const msg = '[supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

/**
 * Single Supabase client instance for the app
 */
const supabase: SupabaseClient = createClient(url, anon);

export default supabase;