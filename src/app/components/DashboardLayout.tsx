'use client';
import { useSession, signOut } from 'next-auth/react';
import { Home, Users, BarChart3, Settings, LogOut, Sun, Moon, Search, CheckCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import JobDescriptionWidget from './JobDescriptionWidget';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children, role = 'Employee' }: { children: React.ReactNode; role?: string }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            GF
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Golden Fork</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavLink href="/" icon={Home} label="Dashboard" />
          {isManager && (
            <>
              <NavLink href="/team" icon={Users} label="Team" />
              <NavLink href="/approvals" icon={CheckCircle} label="Approvals" />
              <NavLink href="/settings" icon={Settings} label="Settings" />
            </>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <JobDescriptionWidget role={role} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</span>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* TOP BAR (Mobile + Desktop Search) */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
              GF
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Golden Fork</span>
          </div>

          {/* Search trigger */}
          <button className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-64 border border-transparent dark:border-gray-700">
            <Search size={16} />
            <span>Search anything... (Cmd+K)</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{session.user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
              {session.user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CMD+K PALETTE */}
        <CommandPalette />

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around z-50 pb-safe">
        <a href="#" className="flex flex-col items-center gap-1 text-amber-600 dark:text-amber-500">
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
          <BarChart3 size={20} />
          <span className="text-[10px] font-medium">Pipeline</span>
        </a>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
        <button onClick={() => signOut()} className="flex flex-col items-center gap-1 text-red-500">
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </nav>

    </div>
  );
}


