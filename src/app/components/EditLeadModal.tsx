'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { updateLead, deleteLead } from '@/services/leadService';
import { extractCustomFields } from '@/lib/customFieldsUtils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/primitives';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SubmitButton from './SubmitButton';
import CustomFieldsRenderer from './CustomFieldsRenderer';
import { Trash2 } from 'lucide-react';

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

type Props = {
  selectedLead: Lead | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  customFieldDefs: CustomFieldDefinition[];
};

export default function EditLeadModal({ selectedLead, isOpen, onOpenChange, employees, customFieldDefs }: Props) {
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const handleEditSubmit = async (formData: FormData) => {
    if (!selectedLead) return;
    const updates = {
      name: formData.get('name') as string,
      status: formData.get('status') as string,
      followUp: formData.get('followUp') as string,
      notes: formData.get('notes') as string,
      customFields: extractCustomFields(formData)
    };
    
    const res = await updateLead(selectedLead.leadId, updates);
    if (res?.success) {
      toast.success('Lead updated successfully');
      onOpenChange(false);
    } else {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!selectedLead || !confirm('Are you sure you want to delete this lead?')) return;
    const res = await deleteLead(selectedLead.leadId);
    if (res?.success) {
      toast.success('Lead deleted');
      onOpenChange(false);
    } else {
      toast.error(res?.error || 'Failed to delete lead');
    }
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto spatial-glass text-gray-900 dark:text-white">
        <SheetHeader className="mb-6 border-b pb-4 dark:border-gray-800">
          <SheetTitle className="text-xl font-bold">Edit Lead</SheetTitle>
          <p className="text-sm text-gray-500">Logged by {getEmployeeName(selectedLead.employeeId)} on {selectedLead.date}</p>
        </SheetHeader>
        <form action={handleEditSubmit} className="space-y-5">
          <div>
            <Label>Assignee / POC Name</Label>
            <Input name="name" defaultValue={selectedLead.name} className="mt-1" />
          </div>
          <div>
            <Label>Stage</Label>
            <select name="status" defaultValue={selectedLead.status} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label>Follow-up Date</Label>
            <Input type="date" name="followUp" defaultValue={selectedLead.followUp} className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea 
              name="notes" 
              defaultValue={selectedLead.notes} 
              className="mt-1 flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
            />
          </div>
          
          <CustomFieldsRenderer fields={customFieldDefs} entityType="LEAD" values={selectedLead.customFields} />

          <div className="pt-6 flex flex-col gap-3">
            <SubmitButton text="Save Changes" className="w-full" />
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full py-2 px-4 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Lead
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
