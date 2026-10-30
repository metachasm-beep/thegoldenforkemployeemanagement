import { withAuth } from 'next-auth/middleware';

export default function middleware(req: any) {
  return (withAuth as any)(req);
}

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login
     * - /api/auth (NextAuth internals)
     * - /_next/static (Next.js assets)
     * - /_next/image (Next.js image optimization)
     * - /favicon.ico
     * - /manifest.json, /sw.js, and static assets
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
};
