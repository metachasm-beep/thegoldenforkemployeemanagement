'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AutoRefresh({ interval = 30000, enabled = false }: { interval?: number; enabled?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Disabled by default
    if (!enabled) return;

    // Only auto-refresh if we are inside the dashboard, don't refresh the login page.
    if (pathname === '/login') return;

    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval, pathname, enabled]);

  return null;
}
