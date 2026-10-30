'use client';
import { useSession, signOut } from 'next-auth/react';
import { Home, Users, BarChart3, Settings, LogOut, Sun, Moon, CheckCircle, Target, Receipt, Calendar, Trophy, MessageSquare, Banknote, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import JobDescriptionWidget from './JobDescriptionWidget';
import NotificationBell from './NotificationBell';
import PushNotificationToggle from './PushNotificationToggle';
import ProfileAvatar from './ProfileAvatar';
import AlgorithmicBackground from './AlgorithmicBackground';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import { notifier } from '@/lib/notificationManager';
import Onboarding from '@/components/Onboarding';
import InstallAppButton from './InstallAppButton';

export default function DashboardLayout({ children, role = 'Employee' }: { children: React.ReactNode; role?: string }) {
  const { data: session } = useSession();

  // Presence Ping
  useEffect(() => {
    if (!session) return;
    const ping = () => {
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    };
    ping(); // initial ping
    const interval = setInterval(ping, 60000); // ping every 60s
    return () => clearInterval(interval);
  }, [session]);

  // Service Worker and Web Push Registration
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        if (Notification.permission === "granted") {
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          }).then(subscription => {
            fetch("/api/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription)
            }).catch(console.error);
          }).catch(console.error);
        }
      });
    }
  }, []);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (session?.user && (session.user as any).employeeId) {
      const employeeId = (session.user as any).employeeId;
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`private-user-${employeeId}`);
      channel.bind("global-new-message", (data: any) => {
        import("@/lib/notificationManager").then((mod) => mod.playNotificationSound?.());
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chat-global-message", { detail: data }));
        }

        if (window.location.pathname.startsWith("/chat") && !document.hidden) {
          if ((window as any).__ACTIVE_CHAT_ID === data.conversationId) return;
        }
        
        notifier.enqueue(`New message from ${data.senderName}`, {
          description: data.content,
          action: {
            label: "View",
            onClick: () => window.location.href = "/chat"
          }
        });
      });
      return () => pusher.unsubscribe(`private-user-${employeeId}`);
    }
  }, [session]);

  if (!session) return <>{children}</>;

  const isManager = role === 'Manager' || role === 'COO' || role === 'HR';
  const canViewCoo = role === 'Manager' || role === 'COO';

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const active = pathname === href;
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${active ? 'spatial-glass text-amber-600 dark:text-amber-400 font-bold shadow-md' : 'text-gray-600 dark:text-gray-400 hover:spatial-glass hover:text-gray-900 dark:hover:text-gray-100'}`}>
        <Icon size={20} /> {label}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh bg-slate-100 dark:bg-black transition-colors duration-300 relative overflow-hidden">
      {/* Cinematic Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/40 dark:bg-purple-600/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/30 dark:bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <AlgorithmicBackground />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 spatial-glass shrink-0 z-10 !border-y-0 !border-l-0 tour-sidebar">
        <div className="px-4 pt-4 pb-2">
          {/* Obsidian & Champagne Gold Banner Card */}
          <Link
            href="/"
            className="group relative flex items-center gap-3 rounded-2xl p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/90 border border-amber-500/30 hover:border-amber-400/50 shadow-lg overflow-hidden transition-all"
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />
            <img
              src="/logo.jpg"
              alt="The Golden Fork"
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-amber-400/50 shrink-0 relative z-10"
            />
            <div className="flex flex-col min-w-0 flex-1 relative z-10">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-serif font-bold text-sm text-white tracking-tight truncate">
                  The Golden Fork
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  HQ
                </span>
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-amber-200/70 mt-0.5 truncate">
                Executive CRM
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-3 overflow-y-auto">
          <NavLink href="/" icon={Home} label="Dashboard" />
          {canViewCoo && <NavLink href="/coo" icon={ShieldCheck} label="COO Operations" />}
          <NavLink href="/chat" icon={MessageSquare} label="Messages" />
          <NavLink href="/leaderboard" icon={Trophy} label="Leaderboard" />
          {!isManager && <NavLink href="/earnings" icon={Banknote} label="My Earnings" />}
          
          <div className="pt-2 pb-2">
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">Actions</span>
            {role !== "HR" && <NavLink href="/leads/new" icon={Target} label="Log New Lead" />}
            <NavLink href="/expenses/new" icon={Receipt} label="Log Expense" />
            <NavLink href="/pto/new" icon={Calendar} label="Request PTO" />
            <NavLink href="/invoices/new" icon={Receipt} label="Submit Invoice" />
          </div>
          {isManager && (
            <>
              <NavLink href="/team" icon={Users} label="Team" />
              <NavLink href="/approvals" icon={CheckCircle} label="Approvals" />
              <NavLink href="/reports" icon={BarChart3} label="Reports" />
            </>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <NavLink href="/settings" icon={Settings} label="Settings" />
            <InstallAppButton />
            <div className="mt-8" />
            <JobDescriptionWidget role={role} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</span>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors tour-theme-toggle"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-dvh overflow-hidden relative">
        {/* TOP BAR (Hidden on desktop for fullscreen /chat workspace) */}
        <header
          className={`h-16 spatial-glass flex items-center justify-between px-4 md:px-8 shrink-0 z-10 dashboard-header !border-x-0 !border-t-0 !shadow-none ${
            pathname?.startsWith('/chat') ? 'md:hidden' : ''
          }`}
        >
          <Onboarding />
          <Link
            href="/"
            className="md:hidden relative flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/90 border border-amber-500/30 shadow-md overflow-hidden"
          >
            <img
              src="/logo.jpg"
              alt="The Golden Fork"
              className="h-7 w-7 rounded-md object-cover ring-1 ring-amber-400/50 shrink-0"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xs text-white tracking-tight">
                The Golden Fork
              </span>
              <span className="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                HQ
              </span>
            </div>
          </Link>

          {/* CMD+K PALETTE triggers here! */}
          <CommandPalette />

          <div className="flex items-center gap-4 ml-auto">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors tour-theme-toggle"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <PushNotificationToggle />
            <NotificationBell />
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{session.user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
            </div>
            <ProfileAvatar />
          </div>
        </header>

        {/* CONTENT AREA */}
        <div
          className={
            pathname?.startsWith('/chat')
              ? 'flex-1 overflow-hidden p-0 pb-14 md:pb-0 relative flex flex-col min-w-0 w-full h-full'
              : 'flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 relative flex flex-col min-w-0 w-full'
          }
        >
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 spatial-glass flex items-center justify-around p-2 z-50 env(safe-area-inset-bottom) !border-x-0 !border-b-0">
        <Link href="/" className={`p-2 flex flex-col items-center ${pathname === '/' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Home size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>
        {canViewCoo && (
          <Link href="/coo" className={`p-2 flex flex-col items-center ${pathname === '/coo' ? 'text-amber-600' : 'text-gray-500'}`}>
            <ShieldCheck size={20} />
            <span className="text-[10px] mt-1">COO Ops</span>
          </Link>
        )}
        <Link href="/leads/new" className={`p-2 flex flex-col items-center ${pathname === '/leads/new' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Target size={20} />
          <span className="text-[10px] mt-1">Log Lead</span>
        </Link>
        <Link href="/leaderboard" className={`p-2 flex flex-col items-center ${pathname === '/leaderboard' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Trophy size={20} />
          <span className="text-[10px] mt-1">Leaders</span>
        </Link>
        {!isManager && (
          <Link href="/earnings" className={`p-2 flex flex-col items-center ${pathname === '/earnings' ? 'text-amber-600' : 'text-gray-500'}`}>
            <Banknote size={20} />
            <span className="text-[10px] mt-1">Earnings</span>
          </Link>
        )}
        {isManager && (
          <Link href="/team" className={`p-2 flex flex-col items-center ${pathname === '/team' ? 'text-amber-600' : 'text-gray-500'}`}>
            <Users size={20} />
            <span className="text-[10px] mt-1">Team</span>
          </Link>
        )}
        <button 
          onClick={() => signOut()}
          className="p-2 flex flex-col items-center text-red-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] mt-1">Exit</span>
        </button>
      </div>
    </div>
  );
}
