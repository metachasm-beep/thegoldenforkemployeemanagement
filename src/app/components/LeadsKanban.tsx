'use client';

import { Lead, Employee } from '@/types';
import { updateLead } from '../actions';
import { useState } from 'react';

type Props = {
  leads: Lead[];
  employees: Employee[];
};

const STAGES = ['Pending', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Converted', 'Lost'];

export default function LeadsKanban({ leads: initialLeads, employees }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const handleStageChange = async (leadId: string, newStage: string) => {
    // Optimistic UI update
    setLeads(current => 
      current.map(l => l.leadId === leadId ? { ...l, status: newStage } : l)
    );
    await updateLead(leadId, { stage: newStage } as any);
  };

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {STAGES.map(stage => (
        <div key={stage} className="min-w-[300px] flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 flex justify-between items-center">
            {stage}
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
              {leads.filter(l => (l.status || 'Pending') === stage).length}
            </span>
          </h3>
          
          <div className="space-y-3">
            {leads.filter(l => (l.status || 'Pending') === stage).map(lead => (
              <div key={lead.leadId} className="bg-white p-4 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">{lead.date}</span>
                  <select 
                    className="text-xs bg-gray-50 border rounded outline-none p-1"
                    value={lead.status || 'Pending'}
                    onChange={(e) => handleStageChange(lead.leadId, e.target.value)}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                
                <p className="font-medium text-gray-800 text-sm">Assignee: {lead.assignee || 'Unassigned'}</p>
                <p className="text-xs text-blue-600 mt-1 font-medium">Sales Rep: {getEmployeeName(lead.employeeId)}</p>
                
                {lead.notes && (
                  <p className="text-xs text-gray-500 mt-3 border-t pt-2 line-clamp-2">
                    "{lead.notes}"
                  </p>
                )}
              </div>
            ))}
            
            {leads.filter(l => (l.status || 'Pending') === stage).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded">
                No leads
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
