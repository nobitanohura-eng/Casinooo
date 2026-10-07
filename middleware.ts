import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const publicPaths = [
    '/login',
    '/auth/callback',
    '/api/auth',
    '/api/health',
    '/api/optout',
    '/unsubscribe',
    '/api/webhooks/resend',
  ];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!user && !isPublic) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in and visiting /login, redirect directly to dashboard
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
