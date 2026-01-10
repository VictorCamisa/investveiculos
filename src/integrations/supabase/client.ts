import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = 'https://rugbunseyblzapwzevqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Z2J1bnNleWJsemFwd3pldnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzg5ODIsImV4cCI6MjA4MzU1NDk4Mn0.1_DRJ9LU6IMZjrb418FktcYywDZ9HV2QJj-vM4Ga9bA';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
