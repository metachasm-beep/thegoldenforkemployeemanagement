'use client';

import { useState, useEffect } from 'react';
import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { updateLead, deleteLead } from '@/services/leadService';
import { extractCustomFields } from '@/lib/customFieldsUtils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/primitives';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubmitButton from './SubmitButton';
import CustomFieldsRenderer from './CustomFieldsRenderer';
import CompanyLogo from './CompanyLogo';
import {
  Trash2,
  Mail,
  Phone,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  User,
  Calendar,
  ListTodo,
  AlertCircle,
  FileText,
  Pencil,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

type Props = {
  selectedLead: Lead | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  customFieldDefs: CustomFieldDefinition[];
  isManager?: boolean;
  initialMode?: 'view' | 'edit';
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
  initialMode = 'view',
  onLeadUpdated,
  onLeadDeleted,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [currentLead, setCurrentLead] = useState<Lead | null>(selectedLead);

  useEffect(() => {
    setCurrentLead(selectedLead);
  }, [selectedLead]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode, selectedLead?.leadId]);

  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name || 'Unknown Executive';

  if (!currentLead) return null;

  const parsedObjections = currentLead.objections
    ? currentLead.objections
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const handleEditSubmit = async (formData: FormData) => {
    if (!currentLead) return;
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

    const res = await updateLead(currentLead.leadId, updates);
    if (res?.success) {
      toast.success('Lead updated successfully');
      const updated = (res.lead || { ...currentLead, ...updates }) as Lead;
      setCurrentLead(updated);
      onLeadUpdated?.(updated);
      router.refresh();
      setMode('view');
    } else {
      toast.error(res?.error || 'Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!currentLead || !confirm('Are you sure you want to delete this lead?')) return;
    const res = await deleteLead(currentLead.leadId);
    if (res?.success) {
      toast.success('Lead deleted');
      onLeadDeleted?.(currentLead.leadId);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(res?.error || 'Failed to delete lead');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-0 gap-0 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        {/* HEADER SECTION */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-gray-800/90 dark:via-gray-900 dark:to-gray-900 p-6 sm:p-8 border-b border-gray-200/80 dark:border-gray-800">
          <DialogHeader className="text-left">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-8">
              <div className="flex items-start gap-4 min-w-0">
                <CompanyLogo name={currentLead.name} size={56} />
                <div className="min-w-0">
                  <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words leading-tight">
                    {currentLead.name || 'Unnamed Lead'}
                  </DialogTitle>
                  <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full">
                      {currentLead.status}
                    </span>
                    {currentLead.status === 'Converted' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Assigned to{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {getEmployeeName(currentLead.employeeId)}
                      </span>{' '}
                      • Logged on{' '}
                      {new Date(currentLead.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* VIEW / EDIT MODE TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  mode === 'view'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    : 'bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'view' ? (
                  <>
                    <Pencil size={14} /> Edit Lead
                  </>
                ) : (
                  <>
                    <Eye size={14} /> View Details
                  </>
                )}
              </button>
            </div>

            {/* Quick Contact Links */}
            {(currentLead.phone || currentLead.email || currentLead.linkedIn) && (
              <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-gray-200/60 dark:border-gray-700/60 flex-wrap">
                {currentLead.phone && (
                  <a
                    href={`tel:${currentLead.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100"
                  >
                    <Phone size={13} /> Call {currentLead.phone}
                  </a>
                )}
                {currentLead.email && (
                  <a
                    href={`mailto:${currentLead.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 break-all"
                  >
                    <Mail size={13} /> {currentLead.email}
                  </a>
                )}
                {currentLead.linkedIn && (
                  <a
                    href={currentLead.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 break-all"
                  >
                    <ExternalLink size={13} /> {currentLead.linkedIn}
                  </a>
                )}
              </div>
            )}
          </DialogHeader>
        </div>

        {/* MODE 1: VIEW DETAILS */}
        {mode === 'view' ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 space-y-6"
          >
            {/* Contact Information — Spacious 3-Column Grid */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/70 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    Email Address
                  </div>
                  {currentLead.email ? (
                    <a
                      href={`mailto:${currentLead.email}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {currentLead.email}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No email provided</span>
                  )}
                </div>

                <div className="bg-gray-50/70 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    Phone Number
                  </div>
                  {currentLead.phone ? (
                    <a
                      href={`tel:${currentLead.phone}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-words"
                    >
                      {currentLead.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No phone provided</span>
                  )}
                </div>

                <div className="bg-gray-50/70 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                    <LinkIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    LinkedIn / Website
                  </div>
                  {currentLead.linkedIn ? (
                    <a
                      href={currentLead.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {currentLead.linkedIn}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No link provided</span>
                  )}
                </div>
              </div>
            </section>

            {/* Action Items */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Action Items
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Follow-up Date</span>
                  </div>
                  <p className="font-semibold text-base text-indigo-900 dark:text-indigo-100 break-words">
                    {currentLead.followUp || 'None scheduled'}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <ListTodo className="w-4 h-4" />
                    <span className="text-xs font-medium">Next Action</span>
                  </div>
                  <p className="font-semibold text-base text-orange-900 dark:text-orange-100 break-words">
                    {currentLead.nextAction || 'None specified'}
                  </p>
                </div>
              </div>
            </section>

            {/* Objections & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Key Objections
                </h3>
                <div className="bg-gray-50/70 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[110px]">
                  {parsedObjections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedObjections.map((obj: string) => (
                        <span
                          key={obj}
                          className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-lg text-xs font-medium break-words"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No objections recorded.</p>
                  )}
                </div>
              </section>

              <section className="lg:col-span-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Executive Notes
                </h3>
                <div className="bg-gray-50/70 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed min-h-[110px]">
                  {currentLead.notes || (
                    <span className="text-gray-400 italic">No notes recorded.</span>
                  )}
                </div>
              </section>
            </div>

            {/* Custom Fields */}
            {currentLead.customFields &&
              Object.keys(currentLead.customFields as Record<string, any>).length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Custom Fields &amp; Verification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(currentLead.customFields as Record<string, any>).map(
                      ([k, v]) => {
                        if (v === null || v === undefined || v === '') return null;
                        const def = customFieldDefs.find((d) => d.name === k);
                        return (
                          <div
                            key={k}
                            className="bg-gray-50/70 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
                          >
                            <p className="text-xs text-gray-500 mb-1">{def?.label || k}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                              {String(v)}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )}

            {/* Bottom Actions in View Mode */}
            <div className="pt-4 border-t border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 px-5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Lead
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Lead Details
              </button>
            </div>
          </motion.div>
        ) : (
          /* MODE 2: EDIT FORM */
          <motion.form
            key={currentLead.leadId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            action={handleEditSubmit}
            className="p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label>Venue / Lead Name</Label>
                <Input
                  name="name"
                  required
                  defaultValue={currentLead.name}
                  placeholder="Restaurant or POC Name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Pipeline Stage</Label>
                <select
                  name="status"
                  defaultValue={currentLead.status}
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
                    defaultValue={currentLead.employeeId}
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
                    value={getEmployeeName(currentLead.employeeId)}
                    className="mt-1 opacity-75"
                  />
                )}
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  name="phone"
                  defaultValue={currentLead.phone || ''}
                  placeholder="+91 98765 43210"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={currentLead.email || ''}
                  placeholder="owner@venue.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>LinkedIn / Website URL</Label>
                <Input
                  type="url"
                  name="linkedIn"
                  defaultValue={currentLead.linkedIn || ''}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  name="followUp"
                  defaultValue={currentLead.followUp || ''}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Next Action</Label>
                <Input
                  type="text"
                  name="nextAction"
                  defaultValue={currentLead.nextAction || ''}
                  placeholder="e.g., Schedule QR Table Demo"
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Label>Key Objections (comma-separated)</Label>
                <Input
                  type="text"
                  name="objections"
                  defaultValue={currentLead.objections || ''}
                  placeholder="e.g., Pricing, Existing POS contract, Needs partner approval"
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Label>Executive Notes</Label>
                <textarea
                  name="notes"
                  defaultValue={currentLead.notes || ''}
                  placeholder="Detailed field visit notes, table count, current billing software..."
                  className="mt-1 flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {customFieldDefs.length > 0 && (
              <div>
                <CustomFieldsRenderer
                  fields={customFieldDefs}
                  entityType="LEAD"
                  values={currentLead.customFields}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Lead
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton text="Save Lead Updates" className="flex-1 sm:flex-initial px-6" />
              </div>
            </div>
          </motion.form>
        )}
      </DialogContent>
    </Dialog>
  );
}
