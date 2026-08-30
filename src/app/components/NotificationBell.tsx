'use client';
import { useState, useEffect } from 'react';
import { getMyNotifications, markNotificationRead } from '../actions';
import { StaggeredMenu, StaggeredMenuItem } from '@/components/react-bits/StaggeredMenu/StaggeredMenu';
import { useTheme } from 'next-themes';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchNotifs = async () => {
      const data = await getMyNotifications();
      setNotifications(data);
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const items: StaggeredMenuItem[] = notifications.length > 0 
    ? notifications.map(n => ({
        label: n.message.substring(0, 30) + '...',
        ariaLabel: n.message,
        link: '#'
      }))
    : [{ label: 'All caught up!', ariaLabel: 'All caught up!', link: '#' }];

  if (!mounted) return null;

  return (
    <div className="relative z-50 scale-75 transform origin-right">
      <div className="relative">
        <StaggeredMenu
          position="right"
          items={items}
          displaySocials={false}
          menuButtonColor={theme === 'dark' ? '#111827' : '#f3f4f6'}
          openMenuButtonColor={theme === 'dark' ? '#374151' : '#e5e7eb'}
          accentColor="#4f46e5"
          isFixed={false}
        />
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white pointer-events-none z-[60]">
            {notifications.length}
          </span>
        )}
      </div>
    </div>
  );
}
