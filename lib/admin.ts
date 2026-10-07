import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { globalMockDb } from './mock-db';

export function adminDb(): any {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_DB === 'true' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return globalMockDb;
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
