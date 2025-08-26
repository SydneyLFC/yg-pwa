// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// TypeScript: assert env at runtime so the type is string (not string | undefined)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// If you have generated DB types, you can do: createClient<Database>(...)
const supabase: SupabaseClient = createClient(url, anon, {
  auth: { persistSession: true }, // tweak if you don’t want persistence in PWA
});

export default supabase;