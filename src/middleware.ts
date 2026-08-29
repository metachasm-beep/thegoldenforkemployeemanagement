export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login
     * - /api/auth (NextAuth internals)
     * - /_next/static (Next.js assets)
     * - /_next/image (Next.js image optimization)
     * - /favicon.ico
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
