'use client';
import { AuditLog, Employee } from '@/types';
import { Shield, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AnimatedList from '@/components/react-bits/AnimatedList/AnimatedList';

export default function AuditLogsWidget({ logs, employees = [] }: { logs: AuditLog[], employees?: Employee[] }) {
  
  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      // Try to make it human readable
      let parts = [];
      for (const [key, value] of Object.entries(parsed)) {
        if (key.toLowerCase().includes('id') && typeof value === 'string' && value.length > 20) {
            continue; // Skip raw UUIDs in details if they are verbose
        }
        parts.push(`${key}: ${value}`);
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
    <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col">
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
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 w-full">
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
  );
}
