import { withAuth } from 'next-auth/middleware';

export default function middleware(req: any) {
  return (withAuth as any)(req);
}

export const config = {
  matcher: [
    '/((?!login|chat|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
