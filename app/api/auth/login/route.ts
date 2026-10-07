import { NextResponse } from 'next/server';
import { verifyCredentials, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { pin, password, email } = body;

    const user = verifyCredentials({ pin, password, email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid PIN or password. Default PIN is 1234.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);
    const response = NextResponse.json({ ok: true, user });

    // Check if running under HTTPS
    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      (process.env.APP_BASE_URL || '').startsWith('https://');

    // 30 days valid session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
