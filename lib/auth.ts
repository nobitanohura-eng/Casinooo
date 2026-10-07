import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function requireUser() {
  // Safe test harness override
  if (process.env.NODE_ENV === 'test' && (process.env.TEST_USER_EMAIL || !process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    const testEmail = process.env.TEST_USER_EMAIL || 'owner@papatransport.com';
    const allowed = (process.env.ALLOWED_EMAILS || process.env.APP_ALLOWED_EMAILS || '')
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    if (process.env.TEST_AUTH_REJECT === 'true') {
      return {
        error: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
        user: null,
        supabase: null as any,
      };
    }

    if (allowed.length > 0 && !allowed.includes(testEmail.toLowerCase())) {
      return {
        error: NextResponse.json({ error: 'Forbidden: Email is not on the authorized allowlist' }, { status: 403 }),
        user: null,
        supabase: null as any,
      };
    }

    return {
      error: null,
      user: { id: 'test-user-id', email: testEmail } as any,
      supabase: null as any,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowed = (process.env.ALLOWED_EMAILS || process.env.APP_ALLOWED_EMAILS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
      user: null,
      supabase,
    };
  }

  if (allowed.length > 0 && !allowed.includes((user.email || '').toLowerCase())) {
    return {
      error: NextResponse.json({ error: 'Forbidden: Email is not on the authorized allowlist' }, { status: 403 }),
      user: null,
      supabase,
    };
  }

  return { error: null, user, supabase };
}
