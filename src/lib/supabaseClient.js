// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

/**
 * Read public env (define in `.env.local`)
 * NEXT_PUBLIC_* are exposed to the browser in Next.js
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast so you notice misconfig early
  throw new Error(
    '[supabase] Missing env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

/** Single shared client */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
export { supabase };