'use client';
import { AuditLog, Employee } from '@/types';
import { Shield, Clock, User, Info, Search, Maximize2, Minimize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AnimatedList from '@/components/react-bits/AnimatedList/AnimatedList';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function AuditLogsWidget({ logs, employees = [] }: { logs: AuditLog[], employees?: Employee[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
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
        if (key === 'leadDetails') continue; // Skip full lead snapshot in preview
        if (key.toLowerCase().includes('id') && typeof value === 'string' && value.length > 20) {
            continue; // Skip raw UUIDs in details if they are verbose
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
    <>
      <div className={`flex flex-col bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all ${isFullScreen ? 'fixed inset-4 md:inset-8 z-50 p-6 md:p-8 bg-white/95 dark:bg-gray-950/95 shadow-2xl overflow-hidden' : 'h-[32rem] p-4 md:p-6'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 shrink-0">
            <Shield className="text-indigo-500" />
            System Audit Logs
          </h3>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="relative flex-1 min-w-[120px] sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              />
            </div>
            
            <select 
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[130px]"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 ml-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors shrink-0"
              title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
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
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-950 p-1.5 rounded-md line-clamp-2">
                      {formatDetails(log.details)}
                    </span>
                  </div>
                </div>
              ))} 
            />
          )}
        </div>
      </div>

      {isFullScreen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFullScreen(false)}
        />
      )}

      {/* Log Details Modal */}
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
    </>
  );
}
