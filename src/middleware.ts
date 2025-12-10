import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { verifyToken } from '@/app/lib/auth';
import { verifyToken } from '@/app/lib/jwt'; // [!code change]

// Paths that require authentication (optional, mainly for protecting pages)
const protectedPaths = ['/dashboard']; 

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  if (token) {
    // We cannot use the full verifyToken from lib/auth here because 
    // standard jsonwebtoken library doesn't always play nice with Edge runtime.
    // However, for this "Simple JWT" task, we will attempt basic decoding 
    // or rely on the API route to do the deep verification. 
    // To properly support Edge, we'd typically use 'jose'. 
    // For now, we will pass the token through and let the API route logic handle specific DB updates.
    
    // BUT, we can try to optimistically decode to set a header for our API routes.
    // If this fails in Edge, we skip.
    try {
        // Simple manual decode for payload extraction if needed, 
        // or just pass the token in a header for easier access in API.
        response.headers.set('x-auth-token', token);
    } catch (e) {
        // ignore
    }
  }

  // Protect specific UI routes
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/chat', '/dashboard/:path*'],
};