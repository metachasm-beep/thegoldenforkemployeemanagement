'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { updateLead } from '@/services/leadService';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Avatar from 'boring-avatars';
import EditLeadModal from './EditLeadModal';
import { ArrowUpDown, Pencil } from 'lucide-react';

type Props = {
  leads: Lead[];
  employees: Employee[];
  customFieldDefs?: CustomFieldDefinition[];
  isManager?: boolean;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onLeadDeleted?: (leadId: string) => void;
};

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsTable({
  leads,
  employees,
  customFieldDefs = [],
  isManager = false,
  onLeadUpdated,
  onLeadDeleted,
}: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );

  const sortedLeads = useMemo(() => {
    if (!sortConfig) return leads;
    return [...leads].sort((a, b) => {
      let aVal = (a as any)[sortConfig.key];
      let bVal = (b as any)[sortConfig.key];

      if (sortConfig.key === 'assignee') {
        aVal = employees.find((e) => e.id === a.employeeId)?.name || '';
        bVal = employees.find((e) => e.id === b.employeeId)?.name || '';
      }

      if (customFieldDefs.some((def) => def.name === sortConfig.key)) {
        aVal = (a.customFields as any)?.[sortConfig.key] || '';
        bVal = (b.customFields as any)?.[sortConfig.key] || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortConfig, employees, customFieldDefs]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleBlur = async (lead: Lead, field: string, value: string, isCustom = false) => {
    const oldValue = isCustom ? (lead.customFields as any)?.[field] : (lead as any)[field];

    if ((oldValue || '') === (value || '')) return;

    setSavingId(lead.leadId);
    try {
      const updates: any = {};

      if (isCustom) {
        updates.customFields = {
          ...((lead.customFields as object) || {}),
          [field]: value,
        };
      } else {
        updates[field] = value;
      }

      const res = await updateLead(lead.leadId, updates);
      if (!res?.success) throw new Error(res?.error || 'Failed');
      toast.success('Saved');
      if (res.lead) {
        onLeadUpdated?.(res.lead as Lead);
      }
    } catch {
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
              {isManager && <th className="px-4 py-3 font-medium w-14 text-center">#</th>}
              <th
                className="px-4 py-3 font-medium min-w-[200px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-1">
                  Lead Name <ArrowUpDown size={14} />
                </div>
              </th>
              <th
                className="px-4 py-3 font-medium min-w-[160px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center gap-1">
                  Stage <ArrowUpDown size={14} />
                </div>
              </th>
              <th
                className="px-4 py-3 font-medium min-w-[150px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('followUp')}
              >
                <div className="flex items-center gap-1">
                  Follow-up <ArrowUpDown size={14} />
                </div>
              </th>
              <th
                className="px-4 py-3 font-medium min-w-[250px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('notes')}
              >
                <div className="flex items-center gap-1">
                  Notes <ArrowUpDown size={14} />
                </div>
              </th>
              <th
                className="px-4 py-3 font-medium min-w-[160px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Logged At <ArrowUpDown size={14} />
                </div>
              </th>
              <th
                className="px-4 py-3 font-medium min-w-[150px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => requestSort('assignee')}
              >
                <div className="flex items-center gap-1">
                  Assignee <ArrowUpDown size={14} />
                </div>
              </th>
              {customFieldDefs.map((def) => (
                <th
                  key={def.name}
                  className="px-4 py-3 font-medium min-w-[150px] cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => requestSort(def.name)}
                >
                  <div className="flex items-center gap-1">
                    {def.label} <ArrowUpDown size={14} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-medium w-20 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={7 + customFieldDefs.length + (isManager ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No leads found.
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead, index) => (
                <tr
                  key={lead.leadId}
                  onClick={() => {
                    setSelectedLead(lead);
                    setIsModalOpen(true);
                  }}
                  className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors ${
                    savingId === lead.leadId ? 'opacity-70' : ''
                  } cursor-pointer`}
                >
                  {isManager && (
                    <td className="px-4 py-3 text-center text-gray-400 font-medium">
                      {index + 1}
                    </td>
                  )}
                  <td className="px-0 py-0 relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={lead.name}
                      onBlur={(e) => handleBlur(lead, 'name', e.target.value)}
                      className="w-full bg-transparent px-4 py-3 focus:bg-indigo-50/40 dark:focus:bg-indigo-950/30 focus:outline-none"
                    />
                  </td>
                  <td className="px-0 py-0 relative" onClick={(e) => e.stopPropagation()}>
                    <select
                      defaultValue={lead.status || 'Lead Captured'}
                      onChange={(e) => handleBlur(lead, 'status', e.target.value)}
                      className="w-full bg-transparent dark:bg-gray-900 px-4 py-3 cursor-pointer focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-0 py-0 relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      defaultValue={lead.followUp || ''}
                      onBlur={(e) => handleBlur(lead, 'followUp', e.target.value)}
                      className="w-full bg-transparent px-4 py-3 focus:bg-indigo-50/40 dark:focus:bg-indigo-950/30 focus:outline-none"
                    />
                  </td>
                  <td className="px-0 py-0 relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={lead.notes || ''}
                      onBlur={(e) => handleBlur(lead, 'notes', e.target.value)}
                      placeholder="Add notes..."
                      className="w-full bg-transparent px-4 py-3 focus:bg-indigo-50/40 dark:focus:bg-indigo-950/30 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Avatar
                        size={20}
                        name={lead.employeeId}
                        variant="marble"
                        colors={['#3b82f6', '#10b981', '#6366f1', '#eab308', '#ec4899']}
                      />
                      <span className="truncate">
                        {employees.find((e) => e.id === lead.employeeId)?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Custom Fields */}
                  {customFieldDefs.map((def) => {
                    const val = (lead.customFields as Record<string, any>)?.[def.name] || '';
                    return (
                      <td
                        key={def.name}
                        className="px-0 py-0 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {def.type === 'select' ? (
                          <select
                            defaultValue={val}
                            onChange={(e) => handleBlur(lead, def.name, e.target.value, true)}
                            className="w-full bg-transparent dark:bg-gray-900 px-4 py-3 cursor-pointer focus:outline-none"
                          >
                            <option value="">--</option>
                            {def.options &&
                              JSON.parse(def.options).map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            type={
                              def.type === 'number'
                                ? 'number'
                                : def.type === 'date'
                                ? 'date'
                                : 'text'
                            }
                            defaultValue={val}
                            onBlur={(e) => handleBlur(lead, def.name, e.target.value, true)}
                            className="w-full bg-transparent px-4 py-3 focus:bg-indigo-50/40 dark:focus:bg-indigo-950/30 focus:outline-none"
                          />
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditLeadModal
        selectedLead={selectedLead}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        employees={employees}
        customFieldDefs={customFieldDefs}
        isManager={isManager}
        onLeadUpdated={onLeadUpdated}
        onLeadDeleted={onLeadDeleted}
      />
    </div>
  );
}
