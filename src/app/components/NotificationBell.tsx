'use client';
import { useState, useEffect, useRef } from 'react';
import { getMyNotifications, markNotificationRead } from '../actions';
import { useTheme } from 'next-themes';
import { Bell, Check, X } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!mounted) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white tabular-nums border-2 border-white dark:border-gray-950">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium tabular-nums">
                {notifications.length} new
              </span>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {notifications.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map(n => (
                  <li key={n.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group flex gap-3 relative">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 text-pretty">
                        {n.message}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 self-start"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                All caught up!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
