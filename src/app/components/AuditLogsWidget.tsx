'use client';
import { AuditLog } from '@/types';
import { Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AuditLogsWidget({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Shield className="text-indigo-500" />
        System Audit Logs
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center mt-10">No recent activity.</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] flex items-center gap-1 text-gray-400">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400 text-xs mr-2 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
                  ID: {log.employeeId.slice(0, 8)}
                </span>
                <span className="text-xs font-mono bg-gray-200 dark:bg-gray-950 p-1 rounded">
                  {log.details.length > 50 ? log.details.substring(0, 50) + '...' : log.details}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
