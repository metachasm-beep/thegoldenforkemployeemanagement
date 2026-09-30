'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { updateLead } from '@/services/leadService';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import Avatar from 'boring-avatars';
import ViewLeadModal from './ViewLeadModal';

type Props = {
  leads: Lead[];
  employees: Employee[];
  customFieldDefs?: CustomFieldDefinition[];
  isManager?: boolean;
};

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsTable({ leads, employees, customFieldDefs = [], isManager = false }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBlur = async (lead: Lead, field: string, value: string, isCustom = false) => {
    // Check if value changed
    let oldValue = isCustom 
      ? (lead.customFields as any)?.[field] 
      : (lead as any)[field];
    
    if (oldValue === value) return; // No change

    setSavingId(lead.leadId);
    try {
      let updates: any = {};
      
      if (isCustom) {
        updates.customFields = {
          ...(lead.customFields as object || {}),
          [field]: value
        };
      } else {
        updates[field] = value;
      }

      const res = await updateLead(lead.leadId, updates);
      if (!res?.success) throw new Error('Failed');
    } catch (err) {
      toast.error('Failed to auto-save change');
    }
    setSavingId(null);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 font-lexend">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[200px]">Lead Name</th>
              <th className="px-4 py-3 font-medium min-w-[150px]">Stage</th>
              <th className="px-4 py-3 font-medium min-w-[150px]">Follow-up</th>
              <th className="px-4 py-3 font-medium min-w-[250px]">Notes</th>
              <th className="px-4 py-3 font-medium min-w-[150px]">Assignee</th>
              {customFieldDefs.map(def => (
                <th key={def.name} className="px-4 py-3 font-medium min-w-[150px]">
                  {def.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5 + customFieldDefs.length} className="px-4 py-8 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            ) : leads.map(lead => (
              <tr 
                key={lead.leadId} 
                onClick={() => { if(isManager) { setSelectedLead(lead); setIsModalOpen(true); } }}
                className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors ${savingId === lead.leadId ? 'opacity-70' : ''} ${isManager ? 'cursor-pointer' : ''}`}
              >
                <td className="px-0 py-0 relative">
                  <input disabled={isManager} 
                    type="text"
                    defaultValue={lead.name}
                    onBlur={(e) => handleBlur(lead, 'name', e.target.value)}
                    className="w-full bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
                  />
                </td>
                <td className="px-0 py-0 relative">
                  <select disabled={isManager}
                    defaultValue={lead.status || 'Lead Captured'}
                    onChange={(e) => handleBlur(lead, 'status', e.target.value)}
                    className="w-full bg-transparent px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-0 py-0 relative">
                  <input disabled={isManager} 
                    type="date"
                    defaultValue={lead.followUp || ''}
                    onBlur={(e) => handleBlur(lead, 'followUp', e.target.value)}
                    className="w-full bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
                  />
                </td>
                <td className="px-0 py-0 relative">
                  <input disabled={isManager} 
                    type="text"
                    defaultValue={lead.notes || ''}
                    onBlur={(e) => handleBlur(lead, 'notes', e.target.value)}
                    placeholder="Add notes..."
                    className="w-full bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
                  />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div className="flex items-center gap-2">
                    <Avatar 
                      size={20} 
                      name={lead.employeeId} 
                      variant="marble" 
                      colors={['#3b82f6', '#10b981', '#6366f1', '#eab308', '#ec4899']} 
                    />
                    <span className="truncate">{employees.find(e => e.id === lead.employeeId)?.name || 'Unassigned'}</span>
                  </div>
                </td>
                
                {/* Custom Fields */}
                {customFieldDefs.map(def => {
                  const val = (lead.customFields as Record<string, any>)?.[def.name] || '';
                  return (
                    <td key={def.name} className="px-0 py-0 relative">
                      {def.type === 'select' ? (
                        <select disabled={isManager}
                          defaultValue={val}
                          onChange={(e) => handleBlur(lead, def.name, e.target.value, true)}
                          className="w-full bg-transparent px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <option value="">--</option>
                          {def.options && JSON.parse(def.options).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input disabled={isManager} 
                          type={def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
                          defaultValue={val}
                          onBlur={(e) => handleBlur(lead, def.name, e.target.value, true)}
                          className="w-full bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isManager && isModalOpen && (
        <ViewLeadModal
          selectedLead={selectedLead}
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          employees={employees}
          customFieldDefs={customFieldDefs}
        />
      )}
    </div>
  );
}
