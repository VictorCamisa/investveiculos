import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = 'https://ahfoixzdnpswuqavbmgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZm9peHpkbnBzd3VxYXZibWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDE0MTcsImV4cCI6MjA4MTE3NzQxN30.7n1o2ruVobI7EOFcSeYR_2NPdAhL3a7sALqFcf9Uzf0';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
