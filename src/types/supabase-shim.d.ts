declare module '@/lib/supabaseClient' {
  import { SupabaseClient } from '@supabase/supabase-js';
  export const supabase: SupabaseClient;
  export default supabase;
}