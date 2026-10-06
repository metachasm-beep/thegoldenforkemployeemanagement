'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AutoRefresh({ interval = 30000 }: { interval?: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only auto-refresh if we are inside the dashboard, don't refresh the login page.
    if (pathname === '/login') return;

    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval, pathname]);

  return null;
}
