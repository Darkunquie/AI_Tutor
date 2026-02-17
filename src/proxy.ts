import { NextRequest, NextResponse } from 'next/server';

// Next.js 16 proxy (replaces middleware.ts)
// JWT authentication is handled directly in API route handlers via withAuth wrapper.
// This proxy only handles page-level routing pass-through.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
