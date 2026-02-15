import { createClient } from '@supabase/supabase-js';

export const getSupabaseBrowser = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured (missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
  }
  return createClient(url, anonKey);
};

