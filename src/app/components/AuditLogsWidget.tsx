'use client';
import { AuditLog, Employee } from '@/types';
import { Shield, Clock, User, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AnimatedList from '@/components/react-bits/AnimatedList/AnimatedList';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AuditLogsWidget({ logs, employees = [] }: { logs: AuditLog[], employees?: Employee[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      // Try to make it human readable
      let parts = [];
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

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : `ID: ${id.slice(0, 6)}`;
  };

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-[32rem] flex flex-col">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield className="text-indigo-500" />
          System Audit Logs
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center mt-10">No recent activity.</p>
          ) : (
            <AnimatedList 
              className="w-full"
              items={logs.map(log => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 w-full cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] flex items-center gap-1 text-gray-400">
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

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl">
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
            <div className="space-y-4 mt-2">
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
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.assignee || '—'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Status</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.status || '—'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Owner</span>
                              <span className="font-medium text-gray-900 dark:text-white">{getEmployeeName(parsed.leadDetails.employeeId)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Date</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.date || '—'}</span>
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
                        <pre className="text-xs text-green-400 font-mono leading-relaxed">
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
