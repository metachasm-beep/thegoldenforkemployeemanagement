'use client';
import { useSession, signOut } from 'next-auth/react';
import { Home, Users, BarChart3, Settings, LogOut, Sun, Moon, CheckCircle, Target, Receipt, Calendar, Trophy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import JobDescriptionWidget from './JobDescriptionWidget';
import NotificationBell from './NotificationBell';
import ProfileAvatar from './ProfileAvatar';
import AlgorithmicBackground from './AlgorithmicBackground';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children, role = 'Employee' }: { children: React.ReactNode; role?: string }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    // Feature 5: Auto-logout after 15 minutes of inactivity
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut();
      }, 15 * 60 * 1000); // 15 mins
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  if (!session) return <>{children}</>;

  const isManager = role === 'Manager';

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const active = pathname === href;
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${active ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}>
        <Icon size={20} /> {label}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300 relative">
      <AlgorithmicBackground />
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 shrink-0 z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            GF
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Golden Fork
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavLink href="/" icon={Home} label="Dashboard" />
          <NavLink href="/leaderboard" icon={Trophy} label="Leaderboard" />
          
          <div className="pt-2 pb-2">
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">Actions</span>
            <NavLink href="/leads/new" icon={Target} label="Log New Lead" />
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
              <div className="mt-8" />
              <JobDescriptionWidget role={role} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</span>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
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
        {/* TOP BAR */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              GF
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Golden Fork
            </span>
          </div>

          {/* CMD+K PALETTE triggers here! */}
          <CommandPalette />

          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell />
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{session.user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
            </div>
            <ProfileAvatar />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 relative flex flex-col">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around p-2 z-50 env(safe-area-inset-bottom)">
        <Link href="/" className={`p-2 flex flex-col items-center ${pathname === '/' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Home size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>
        <Link href="/leads/new" className={`p-2 flex flex-col items-center ${pathname === '/leads/new' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Target size={20} />
          <span className="text-[10px] mt-1">Log Lead</span>
        </Link>
        <Link href="/leaderboard" className={`p-2 flex flex-col items-center ${pathname === '/leaderboard' ? 'text-amber-600' : 'text-gray-500'}`}>
          <Trophy size={20} />
          <span className="text-[10px] mt-1">Leaders</span>
        </Link>
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
