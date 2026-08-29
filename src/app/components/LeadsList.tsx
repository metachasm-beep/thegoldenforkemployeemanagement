'use client';

import { Lead, Employee } from '@/types';
import { markLeadConverted } from '../actions';
import { useTransition } from 'react';

export default function LeadsList({ leads, employees }: { leads: Lead[], employees: Employee[] }) {
  const [isPending, startTransition] = useTransition();

  if (leads.length === 0) {
    return <p className="text-sm text-gray-500">No leads logged yet.</p>;
  }

  const handleConvert = (leadId: string) => {
    startTransition(async () => {
      await markLeadConverted(leadId);
    });
  };

  return (
    <ul className="space-y-3">
      {leads.map(lead => {
        const empName = employees.find(e => e.id === lead.employeeId)?.name || 'Unknown Employee';
        
        return (
          <li key={lead.leadId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-sm text-gray-900">{empName}</p>
              <p className="text-xs text-gray-500">{lead.date}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                lead.status === 'Converted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {lead.status}
              </span>
              
              {lead.status === 'Pending' && (
                <button
                  onClick={() => handleConvert(lead.leadId)}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Mark Converted
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
