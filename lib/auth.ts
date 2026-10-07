import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifySessionToken, SessionUser, SESSION_COOKIE_NAME } from '@/lib/session';

export type AuthResult =
  | { error: NextResponse; user: null; supabase?: any }
  | { error: null; user: SessionUser; supabase?: any };

export async function requireUser(): Promise<AuthResult> {
  const allowed = (process.env.ALLOWED_EMAILS || process.env.APP_ALLOWED_EMAILS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  // Safe test harness override
  if (process.env.NODE_ENV === 'test' && (process.env.TEST_USER_EMAIL || !process.env.DATABASE_URL)) {
    const testEmail = process.env.TEST_USER_EMAIL || 'owner@papatransport.com';

    if (process.env.TEST_AUTH_REJECT === 'true') {
      return {
        error: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
        user: null,
      };
    }

    if (allowed.length > 0 && !allowed.includes(testEmail.toLowerCase())) {
      return {
        error: NextResponse.json({ error: 'Forbidden: Email is not on the authorized allowlist' }, { status: 403 }),
        user: null,
      };
    }

    return {
      error: null,
      user: { id: 'test-user-id', email: testEmail, name: 'NCR Transport Owner', role: 'owner' },
    };
  }

  // Normal server request verification via cookie
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // If called outside standard cookie context
  }

  if (!token) {
    try {
      const headerStore = await headers();
      const rawCookie = headerStore.get('cookie') || '';
      const match = rawCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) {
        token = match[1];
      }
      if (!token) {
        const authHeader = headerStore.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }
    } catch {
      // If called outside standard header context
    }
  }

  const user = token ? verifySessionToken(token) : null;

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
      user: null,
    };
  }

  if (allowed.length > 0 && !allowed.includes((user.email || '').toLowerCase())) {
    return {
      error: NextResponse.json({ error: 'Forbidden: Email is not on the authorized allowlist' }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user };
}
