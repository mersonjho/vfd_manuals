import { NextResponse } from 'next/server';

// SHA256("bits123" + "vfd-salt-2026") — pre-computed for Edge middleware comparison
const VALID_TOKEN = '4902d6a1ccbbf9484e4b8b85eff57631f85a00bd67cc4a3db7f8d0777d697b73';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API without restriction
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow Next.js internal assets and static files needed for the login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/bits_logo.png'
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get('vfd_auth');
  const token = authCookie?.value;

  if (token === VALID_TOKEN) {
    // Sliding session: refresh the cookie on every visit so it expires
    // only after 48h of inactivity, and resets each time the client returns.
    const response = NextResponse.next();
    response.cookies.set('vfd_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 48, // 48 hours idle timeout
    });
    return response;
  }

  // Not authenticated — redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - login page
     * - auth API
     * - _next static files
     * - favicon
     */
    '/((?!login|api/auth|_next|favicon.ico|bits_logo.png).*)',
  ],
};
