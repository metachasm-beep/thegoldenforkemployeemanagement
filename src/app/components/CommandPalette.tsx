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
        className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-64 border border-transparent dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Search size={16} />
        <span>Search anything...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-100 ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 !opacity-100 backdrop-blur-none max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>Search for leads, employees, or actions.</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="bg-transparent [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-14 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput 
              placeholder="Search leads, employees, or actions..." 
              value={query}
              onValueChange={setQuery}
              className="border-b-0 focus:ring-0 text-base"
            />
            <CommandList className="max-h-[60vh] overflow-y-auto pb-4">
              {isLoading && (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              )}
              {!isLoading && results.length === 0 && query.length > 0 && (
                <CommandEmpty className="p-8 text-center text-slate-500">No results found for "{query}".</CommandEmpty>
              )}
              
              {!isLoading && query.length === 0 && (
                <>
                  <CommandGroup heading="Quick Links">
                    <CommandItem onSelect={() => runCommand(() => router.push('/'))} className="cursor-pointer">
                      <Search className="mr-3 h-4 w-4 text-indigo-500" />
                      <span className="text-sm">Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/team'))} className="cursor-pointer">
                      <User className="mr-3 h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Team Directory</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/settings'))} className="cursor-pointer">
                      <FileText className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="text-sm">Settings</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator className="my-2" />
                  <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => runCommand(() => router.push('/leads/new'))} className="cursor-pointer">
                      <Target className="mr-3 h-4 w-4 text-rose-500" />
                      <span className="text-sm">Log New Lead</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/expenses/new'))} className="cursor-pointer">
                      <Receipt className="mr-3 h-4 w-4 text-amber-500" />
                      <span className="text-sm">Log Expense</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/pto/new'))} className="cursor-pointer">
                      <Calendar className="mr-3 h-4 w-4 text-cyan-500" />
                      <span className="text-sm">Request PTO</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {!isLoading && leads.length > 0 && (
                <CommandGroup heading="Leads" className="mt-2">
                  {leads.map(lead => (
                    <CommandItem key={lead.id} onSelect={() => runCommand(() => router.push(lead.url))} className="cursor-pointer">
                      <Target className="mr-3 h-4 w-4 text-rose-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{lead.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {lead.subtitle.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[300px]">{lead.description}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading && employees.length > 0 && (
                <CommandGroup heading="Employees" className="mt-2">
                  {employees.map(emp => (
                    <CommandItem key={emp.id} onSelect={() => runCommand(() => router.push(emp.url))} className="cursor-pointer">
                      <User className="mr-3 h-4 w-4 text-emerald-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{emp.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase">{emp.subtitle}</span>
                          <span className="text-xs text-slate-500">{emp.description}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {!isLoading && ptos.length > 0 && (
                <CommandGroup heading="PTO & Approvals" className="mt-2">
                  {ptos.map(pto => (
                    <CommandItem key={pto.id} onSelect={() => runCommand(() => router.push(pto.url))} className="cursor-pointer">
                      <Calendar className="mr-3 h-4 w-4 text-cyan-500" />
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
