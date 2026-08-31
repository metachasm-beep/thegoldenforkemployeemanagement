'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Command,
} from "@/components/ui/command"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Search, User, FileText, Target, Receipt, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    async function performSearch() {
      if (!open) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Failed to search', err);
      } finally {
        setIsLoading(false);
      }
    }
    performSearch();
  }, [debouncedQuery, open]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const employees = results.filter(r => r.type === 'Employee');
  const leads = results.filter(r => r.type === 'Lead');
  const ptos = results.filter(r => r.type === 'PTO Request');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search anything...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-100 ml-4">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>Search for leads, employees, or actions.</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput 
              placeholder="Search leads, employees, or actions..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isLoading && (
                <div className="p-4 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              )}
              {!isLoading && results.length === 0 && query.length > 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              
              {!isLoading && query.length === 0 && (
                <>
                  <CommandGroup heading="Pages">
                    <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                      <Search className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/team'))}>
                      <User className="mr-2 h-4 w-4 text-emerald-500" />
                      <span>Team Directory</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                      <FileText className="mr-2 h-4 w-4 text-slate-500" />
                      <span>Settings</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => runCommand(() => router.push('/leads/new'))}>
                      <Target className="mr-2 h-4 w-4 text-rose-500" />
                      <span>Log New Lead</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/expenses/new'))}>
                      <Receipt className="mr-2 h-4 w-4 text-amber-500" />
                      <span>Log Expense</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/pto/new'))}>
                      <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                      <span>Request PTO</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {!isLoading && leads.length > 0 && (
                <CommandGroup heading="Leads">
                  {leads.map(lead => (
                    <CommandItem key={lead.id} onSelect={() => runCommand(() => router.push(lead.url))}>
                      <Target className="mr-2 h-4 w-4 text-rose-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{lead.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {lead.subtitle}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">{lead.description}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading && employees.length > 0 && (
                <CommandGroup heading="Employees">
                  {employees.map(emp => (
                    <CommandItem key={emp.id} onSelect={() => runCommand(() => router.push(emp.url))}>
                      <User className="mr-2 h-4 w-4 text-emerald-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{emp.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-indigo-500 font-medium">{emp.subtitle}</span>
                          <span className="text-xs text-slate-500">{emp.description}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {!isLoading && ptos.length > 0 && (
                <CommandGroup heading="PTO & Approvals">
                  {ptos.map(pto => (
                    <CommandItem key={pto.id} onSelect={() => runCommand(() => router.push(pto.url))}>
                      <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{pto.title}</span>
                        <span className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{pto.description}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
