'use client';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getMyNotifications, markNotificationRead } from '../actions';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getMyNotifications();
      setNotifications(data);
    };
    fetchNotifs();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold flex justify-between items-center">
            Notifications
            <span className="text-xs font-normal text-gray-500">{notifications.length} unread</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">All caught up!</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between gap-3 items-start group">
                  <div className="text-sm">{n.message}</div>
                  <button 
                    onClick={() => handleRead(n.id)}
                    className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium"
                  >
                    Mark read
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
