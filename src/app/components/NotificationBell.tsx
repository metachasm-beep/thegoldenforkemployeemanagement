'use client';
import { useState, useEffect } from 'react';
import { getMyNotifications, markNotificationRead } from '../actions';
import { useRouter } from 'next/navigation';
import { Bell, Check, BellRing } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
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

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!mounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white tabular-nums border-2 border-white dark:border-gray-950 animate-in zoom-in">
              {notifications.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" /> 
            Inbox
          </SheetTitle>
          <SheetDescription>
            You have {notifications.length} unread notifications.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {notifications.length > 0 ? (
            <div className="space-y-4 pr-4">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-900/50 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer group flex justify-between"
                  onClick={() => { 
                    if(n.link) { router.push(n.link); setIsOpen(false); } 
                  }}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleMarkAsRead(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 self-center shrink-0"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 mt-20">
              <Bell className="w-12 h-12 text-gray-200 dark:text-gray-800 mb-4" />
              <p>You are all caught up!</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
