'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, User, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-gray-900/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full w-full">
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3">
            <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="Search leads, employees, or pages..." 
              className="flex-1 py-4 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="text-xs text-gray-500 font-medium px-2 py-2">
              <Command.Item 
                onSelect={() => { setOpen(false); router.push('/'); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/20"
              >
                <Search className="w-4 h-4" /> Dashboard
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs text-gray-500 font-medium px-2 py-2">
              <Command.Item 
                onSelect={() => { setOpen(false); alert('Not implemented directly via CmdK yet'); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer aria-selected:bg-blue-50"
              >
                <User className="w-4 h-4" /> Add New Employee
              </Command.Item>
              <Command.Item 
                onSelect={() => { setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer aria-selected:bg-orange-50"
              >
                <FileText className="w-4 h-4" /> Log New Lead
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
