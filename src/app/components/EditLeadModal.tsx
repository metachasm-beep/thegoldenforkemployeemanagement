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
import CompanyLogo from './CompanyLogo';
import { Trash2, Mail, Phone, ExternalLink, CheckCircle2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

type Props = {
  selectedLead: Lead | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  customFieldDefs: CustomFieldDefinition[];
  isManager?: boolean;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onLeadDeleted?: (leadId: string) => void;
};

export default function EditLeadModal({
  selectedLead,
  isOpen,
  onOpenChange,
  employees,
  customFieldDefs,
  isManager = false,
  onLeadUpdated,
  onLeadDeleted,
}: Props) {
  const router = useRouter();
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown';

  const handleEditSubmit = async (formData: FormData) => {
    if (!selectedLead) return;
    const updates: Record<string, any> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      linkedIn: formData.get('linkedIn') as string,
      status: formData.get('status') as string,
      followUp: formData.get('followUp') as string,
      nextAction: formData.get('nextAction') as string,
      objections: formData.get('objections') as string,
      notes: formData.get('notes') as string,
      customFields: extractCustomFields(formData),
    };

    const newEmployeeId = formData.get('employeeId') as string;
    if (isManager && newEmployeeId) {
      updates.employeeId = newEmployeeId;
    }

    const res = await updateLead(selectedLead.leadId, updates);
    if (res?.success) {
      toast.success('Lead updated successfully');
      if (res.lead && onLeadUpdated) {
        onLeadUpdated(res.lead as Lead);
      }
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(res?.error || 'Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!selectedLead || !confirm('Are you sure you want to delete this lead?')) return;
    const res = await deleteLead(selectedLead.leadId);
    if (res?.success) {
      toast.success('Lead deleted');
      onLeadDeleted?.(selectedLead.leadId);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(res?.error || 'Failed to delete lead');
    }
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto spatial-glass text-gray-900 dark:text-white p-0"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-50/90 to-white dark:from-gray-800/90 dark:to-gray-900 p-6 border-b border-gray-200/80 dark:border-gray-800">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3.5">
              <CompanyLogo name={selectedLead.name} size={44} />
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {selectedLead.name || 'Edit Lead'}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                    {selectedLead.status}
                  </span>
                  {selectedLead.status === 'Converted' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {getEmployeeName(selectedLead.employeeId)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Links */}
            {(selectedLead.phone || selectedLead.email || selectedLead.linkedIn) && (
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex-wrap">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100"
                  >
                    <Phone size={12} /> Call {selectedLead.phone}
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 truncate max-w-[200px]"
                  >
                    <Mail size={12} /> {selectedLead.email}
                  </a>
                )}
                {selectedLead.linkedIn && (
                  <a
                    href={selectedLead.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  >
                    <ExternalLink size={12} /> Link
                  </a>
                )}
              </div>
            )}
          </SheetHeader>
        </div>

        <form
          key={selectedLead.leadId}
          action={handleEditSubmit}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Venue / Lead Name</Label>
              <Input
                name="name"
                required
                defaultValue={selectedLead.name}
                placeholder="Restaurant or POC Name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Pipeline Stage</Label>
              <select
                name="status"
                defaultValue={selectedLead.status}
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Assigned Executive</Label>
              {isManager ? (
                <select
                  name="employeeId"
                  defaultValue={selectedLead.employeeId}
                  className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  {employees
                    .filter((emp) => emp.role !== 'System Bot')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                </select>
              ) : (
                <Input
                  disabled
                  value={getEmployeeName(selectedLead.employeeId)}
                  className="mt-1 opacity-75"
                />
              )}
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                name="phone"
                defaultValue={selectedLead.phone || ''}
                placeholder="+91 98765 43210"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                name="email"
                defaultValue={selectedLead.email || ''}
                placeholder="owner@venue.com"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>LinkedIn / Website URL</Label>
              <Input
                type="url"
                name="linkedIn"
                defaultValue={selectedLead.linkedIn || ''}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                name="followUp"
                defaultValue={selectedLead.followUp || ''}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Next Action</Label>
              <Input
                type="text"
                name="nextAction"
                defaultValue={selectedLead.nextAction || ''}
                placeholder="e.g., Schedule QR Table Demo"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Key Objections (comma-separated)</Label>
              <Input
                type="text"
                name="objections"
                defaultValue={selectedLead.objections || ''}
                placeholder="e.g., Pricing, Existing POS contract, Needs partner approval"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Executive Notes</Label>
              <textarea
                name="notes"
                defaultValue={selectedLead.notes || ''}
                placeholder="Detailed field visit notes, table count, current billing software..."
                className="mt-1 flex min-h-[110px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {customFieldDefs.length > 0 && (
            <div>
              <CustomFieldsRenderer
                fields={customFieldDefs}
                entityType="LEAD"
                values={selectedLead.customFields}
              />
            </div>
          )}

          <div className="pt-4 border-t border-gray-200/80 dark:border-gray-800 flex flex-col gap-2.5">
            <SubmitButton text="Save Lead Updates" className="w-full" />
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
