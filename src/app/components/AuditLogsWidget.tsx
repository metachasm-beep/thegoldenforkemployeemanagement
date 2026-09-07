'use client';
import { AuditLog, Employee } from '@/types';
import { Shield, Clock, User, Info, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AnimatedList from '@/components/react-bits/AnimatedList/AnimatedList';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function AuditLogsWidget({ logs, employees = [] }: { logs: AuditLog[], employees?: Employee[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.action))).sort();
  }, [logs]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : `ID: ${id.slice(0, 6)}`;
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const empName = getEmployeeName(log.employeeId).toLowerCase();
        const actionName = log.action.toLowerCase();
        const detailsStr = log.details.toLowerCase();
        
        if (!empName.includes(query) && !actionName.includes(query) && !detailsStr.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery, selectedAction]);

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      const parts = [];
      for (const [key, value] of Object.entries(parsed)) {
        if (key === 'leadDetails') continue;
        if (key.toLowerCase().includes('id') && typeof value === 'string' && value.length > 20) {
            continue;
        }
        parts.push(`${key}: ${formatValue(value)}`);
      }
      if (parts.length === 0) return "System action recorded";
      return parts.join(' | ');
    } catch {
      return details.length > 80 ? details.substring(0, 80) + '...' : details;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm text-gray-700 dark:text-gray-200">
          <Shield className="w-4 h-4 text-indigo-500" />
          View Audit Logs
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="fixed inset-y-0 right-0 h-[100dvh] max-h-[100dvh] w-full sm:max-w-xl p-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden z-[50]">
        <SheetHeader className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
            <Shield className="text-indigo-500" />
            System Audit Logs
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col p-6 h-full min-h-0">
          <div className="flex items-center gap-2 w-full mb-6 shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 w-full focus-visible:ring-indigo-500"
              />
            </div>
            
            <select 
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0 max-w-[150px] truncate"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center mt-10">No logs match your filters.</p>
            ) : (
              <AnimatedList 
                className="w-full"
                items={filteredLogs.map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 w-full cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] flex items-center gap-1 text-gray-400 shrink-0 ml-2">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1 mt-2">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium flex items-center gap-1">
                        <User size={12} className="text-gray-400" />
                        {getEmployeeName(log.employeeId)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1.5 rounded-md line-clamp-2">
                        {formatDetails(log.details)}
                      </span>
                    </div>
                  </div>
                ))} 
              />
            )}
          </div>
        </div>
      </SheetContent>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl z-[60]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5 text-indigo-500" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Action context and payload
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Action</p>
                  <p className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    {selectedLog.action.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-sm text-right">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Performed By</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getEmployeeName(selectedLog.employeeId)}
                  </p>
                </div>
              </div>

              {(() => {
                let parsed: any = null;
                try {
                  parsed = JSON.parse(selectedLog.details);
                } catch {}

                return (
                  <>
                    {parsed?.leadDetails && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Lead Snapshot</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Assignee</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.assignee || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Status</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.status || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Owner</span>
                              <span className="font-medium text-gray-900 dark:text-white">{getEmployeeName(parsed.leadDetails.employeeId)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Date</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.date || '-'}</span>
                            </div>
                            {parsed.leadDetails.notes && (
                              <div className="col-span-2">
                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Notes</span>
                                <span className="text-gray-700 dark:text-gray-300 italic">"{parsed.leadDetails.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Raw Payload JSON</p>
                      <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                          {parsed ? JSON.stringify(parsed, null, 2) : selectedLog.details}
                        </pre>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}