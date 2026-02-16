import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/api/auth/signup', '/api/auth/login'];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Allow access to public routes and static files
  if (isPublicRoute || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Protected routes: /dashboard, /tutor/*, /api/* (except auth routes)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tutor') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'));

  if (isProtectedRoute) {
    // For API routes, check Authorization header
    if (pathname.startsWith('/api')) {
      const authHeader = request.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
      }

      // Add user info to request headers for API routes to use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-name', payload.name);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // For page routes (/dashboard, /tutor), check for token in cookie or redirect
    // Since we're using localStorage, we can't check it in middleware
    // Instead, we'll let the pages handle auth checks client-side
    // But we can check if there's a token in a cookie (if we add cookie support later)

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
