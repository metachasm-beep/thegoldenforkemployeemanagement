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
  PT_SALES_SCHEDULE_A,
  GOLDEN_FORK_REGIONS,
  PricingRegion,
  BillingModel,
  calculateModulesPricing,
  getLeadNetAnnualRevenue,
} from '@/lib/compensation';
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
  Sparkles,
  Building2,
  Globe,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];
const SCHEDULE_A_INTERNAL_KEYS = new Set([
  'createdByName',
  'pricingRegion',
  'billingModel',
  'extraOutlets',
  'subscribedModules',
  'netAnnualRevenue',
  'grossInvoiceWithGst',
  'liveDemoCompleted',
  'freeTrialEnrolled',
  'isUpsell',
  'cooDemoVerified',
]);

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

  const [pricingRegion, setPricingRegion] = useState<PricingRegion>('india');
  const [billingModel, setBillingModel] = useState<BillingModel>('annual_modular');
  const [selectedModules, setSelectedModules] = useState<string[]>(['CORE_POS_11999']);
  const [extraOutlets, setExtraOutlets] = useState<number>(1);
  const [liveDemoCompleted, setLiveDemoCompleted] = useState<boolean>(false);
  const [freeTrialEnrolled, setFreeTrialEnrolled] = useState<boolean>(false);
  const [isUpsell, setIsUpsell] = useState<boolean>(false);

  useEffect(() => {
    setCurrentLead(selectedLead);
    const cf = (selectedLead?.customFields as Record<string, any>) || {};
    setPricingRegion((cf.pricingRegion as PricingRegion) || 'india');
    setBillingModel((cf.billingModel as BillingModel) || 'annual_modular');
    setExtraOutlets(Math.max(1, Number(cf.extraOutlets) || 1));
    setSelectedModules(
      Array.isArray(cf.subscribedModules) && cf.subscribedModules.length > 0
        ? cf.subscribedModules
        : ['CORE_POS_11999']
    );
    setLiveDemoCompleted(Boolean(cf.liveDemoCompleted || cf.cooDemoVerified));
    setFreeTrialEnrolled(Boolean(cf.freeTrialEnrolled));
    setIsUpsell(Boolean(cf.isUpsell));
  }, [selectedLead]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode, selectedLead?.leadId]);

  if (!currentLead) return null;

  const cf = (currentLead.customFields as Record<string, any>) || {};
  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name || cf.createdByName || 'Unknown Executive';

  const isAssigneeInActiveList = employees.some((e) => e.id === currentLead.employeeId);

  const pricing = calculateModulesPricing(selectedModules, {
    region: pricingRegion,
    billingModel,
    extraOutlets,
  });

  const viewNetAnnual = getLeadNetAnnualRevenue(currentLead);
  const viewGrossWithGst =
    Number(cf.grossInvoiceWithGst) || Math.round(viewNetAnnual * 1.18);
  const viewModules: string[] =
    Array.isArray(cf.subscribedModules) && cf.subscribedModules.length > 0
      ? cf.subscribedModules
      : ['CORE_POS_11999'];

  const toggleModule = (code: string) => {
    setBillingModel('annual_modular');
    if (code === 'ALL_IN_ONE_34999') {
      setSelectedModules((prev) => {
        const hasCrs = prev.includes('MULTI_PROPERTY_CRS_7999');
        if (prev.includes('ALL_IN_ONE_34999')) {
          return hasCrs ? ['CORE_POS_11999', 'MULTI_PROPERTY_CRS_7999'] : ['CORE_POS_11999'];
        }
        return hasCrs ? ['ALL_IN_ONE_34999', 'MULTI_PROPERTY_CRS_7999'] : ['ALL_IN_ONE_34999'];
      });
      return;
    }
    setSelectedModules((prev) => {
      const withoutSuite =
        code === 'MULTI_PROPERTY_CRS_7999'
          ? prev
          : prev.filter((c) => c !== 'ALL_IN_ONE_34999');
      const next = withoutSuite.includes(code)
        ? withoutSuite.filter((c) => c !== code)
        : [...withoutSuite, code];
      return next.length > 0 ? next : ['CORE_POS_11999'];
    });
  };

  const parsedObjections = currentLead.objections
    ? currentLead.objections
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const handleEditSubmit = async (formData: FormData) => {
    if (!currentLead) return;
    const extracted = extractCustomFields(formData);
    const newEmployeeId = formData.get('employeeId') as string;
    const matchedEmp = employees.find((e) => e.id === newEmployeeId);
    const updatedCreatedByName = matchedEmp
      ? matchedEmp.name.trim()
      : cf.createdByName || 'Unknown Executive';

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
      customFields: {
        ...extracted,
        createdByName: updatedCreatedByName,
        pricingRegion,
        billingModel,
        extraOutlets,
        subscribedModules: selectedModules,
        netAnnualRevenue: pricing.netAnnualRevenue,
        grossInvoiceWithGst: pricing.grossInvoiceWithGst,
        liveDemoCompleted,
        freeTrialEnrolled,
        isUpsell,
      },
    };

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

  const extraCustomEntries = Object.entries(cf).filter(
    ([k, v]) => !SCHEDULE_A_INTERNAL_KEYS.has(k) && v !== null && v !== undefined && v !== ''
  );

  const hasPos = selectedModules.includes('CORE_POS_11999');

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
                    {cf.cooDemoVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                        ✓ COO Demo Verified
                      </span>
                    )}
                    {cf.isUpsell && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                        90-Day Upsell
                      </span>
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
            {/* Schedule A Modular Subscription & Demo Summary */}
            <section className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Golden Fork Modular Subscription &amp; Demo Scope (thegoldenfork.de)
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                  {cf.billingModel === 'payg_2_percent' ? (
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      Pay-As-You-Go: 2% Platform Fee (₹0 Upfront)
                    </span>
                  ) : cf.billingModel === 'monthly_2999' ? (
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      Flexible Monthly: ₹2,999/mo (+ 18% GST)
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        Net Annual (Excl. 18% GST): ₹{viewNetAnnual.toLocaleString('en-IN')}/yr
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Gross Invoice: ₹{viewGrossWithGst.toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {viewModules.map((code) => {
                  const mod = PT_SALES_SCHEDULE_A.find((m) => m.code === code);
                  return (
                    <span
                      key={code}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {mod?.shortName || code}
                      {code === 'MULTI_PROPERTY_CRS_7999' && cf.extraOutlets
                        ? ` (${cf.extraOutlets} extra outlets)`
                        : ''}
                    </span>
                  );
                })}
                {(cf.liveDemoCompleted || cf.cooDemoVerified) && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ✓ Live On-Site Demo Conducted
                  </span>
                )}
                {cf.freeTrialEnrolled && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Free Trial Enrolled
                  </span>
                )}
              </div>
            </section>

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

            {/* Extra Custom Fields */}
            {extraCustomEntries.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Additional Custom Fields
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {extraCustomEntries.map(([k, v]) => {
                    const def = customFieldDefs.find((d) => d.name === k);
                    const formatted =
                      typeof v === 'object' ? JSON.stringify(v) : String(v);
                    return (
                      <div
                        key={k}
                        className="bg-gray-50/70 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
                      >
                        <p className="text-xs text-gray-500 mb-1">{def?.label || k}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                          {formatted}
                        </p>
                      </div>
                    );
                  })}
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
                    {!isAssigneeInActiveList && (
                      <option value={currentLead.employeeId}>
                        {cf.createdByName || 'Former Executive'} (Original Creator)
                      </option>
                    )}
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

              {/* Live thegoldenfork.de Modular Pricing Studio in Edit Mode */}
              <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-indigo-900 dark:text-indigo-200 font-bold">
                    Golden Fork Modular Subscription Studio (thegoldenfork.de)
                  </Label>
                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1" />
                    {GOLDEN_FORK_REGIONS.map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => setPricingRegion(reg.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          pricingRegion === reg.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {reg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Plan Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingModel('annual_modular');
                      setSelectedModules(['CORE_POS_11999']);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      billingModel === 'annual_modular' &&
                      selectedModules.length === 1 &&
                      selectedModules[0] === 'CORE_POS_11999'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    Restaurant Only ({pricing.currencySymbol}
                    {pricingRegion === 'india' ? '11,999/yr' : pricingRegion === 'europe' ? '149/yr' : '179/yr'})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingModel('annual_modular');
                      setSelectedModules(['HOTEL_PMS_14999']);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      billingModel === 'annual_modular' &&
                      selectedModules.length === 1 &&
                      selectedModules[0] === 'HOTEL_PMS_14999'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    Hotel PMS Only ({pricing.currencySymbol}
                    {pricingRegion === 'india' ? '14,999/yr' : pricingRegion === 'europe' ? '179/yr' : '219/yr'})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingModel('annual_modular');
                      setSelectedModules(['ALL_IN_ONE_34999']);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      billingModel === 'annual_modular' && pricing.isAllInclusiveSuite
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    ★ All-in-One Suite ({pricing.currencySymbol}
                    {pricingRegion === 'india' ? '34,999/yr' : pricingRegion === 'europe' ? '399/yr' : '499/yr'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingModel('monthly_2999')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      billingModel === 'monthly_2999'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    Monthly ({pricing.currencySymbol}
                    {pricingRegion === 'india' ? '2,999/mo' : pricingRegion === 'europe' ? '39/mo' : '49/mo'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingModel('payg_2_percent')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      billingModel === 'payg_2_percent'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    Pay-As-You-Go (2%)
                  </button>
                </div>

                <div className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 flex flex-wrap justify-between gap-2">
                  <span>
                    {billingModel === 'payg_2_percent'
                      ? '2% Platform Fee (₹0 Upfront)'
                      : `Net: ${pricing.currencySymbol}${pricing.regionAmount.toLocaleString('en-IN')}${
                          billingModel === 'monthly_2999' ? '/mo' : '/yr'
                        }`}
                  </span>
                  {pricingRegion === 'india' && billingModel !== 'payg_2_percent' && (
                    <span>
                      Gross w/ 18% GST: ₹{pricing.grossInvoiceWithGst.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PT_SALES_SCHEDULE_A.filter((m) => m.code !== 'HOTEL_PMS_BUNDLED_11999').map(
                    (mod) => {
                      const checked = selectedModules.includes(mod.code);
                      const isPmsWithPosDiscount = mod.code === 'HOTEL_PMS_14999' && hasPos;
                      const displayPrice =
                        pricingRegion === 'india'
                          ? isPmsWithPosDiscount
                            ? 11999
                            : mod.netAnnualPrice
                          : pricingRegion === 'europe'
                          ? isPmsWithPosDiscount
                            ? 149
                            : mod.annualPriceEur
                          : isPmsWithPosDiscount
                          ? 179
                          : mod.annualPriceUsd;
                      return (
                        <div
                          key={mod.code}
                          onClick={() => toggleModule(mod.code)}
                          className={`cursor-pointer p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 ${
                            checked
                              ? 'bg-white dark:bg-gray-900 border-indigo-500 font-semibold'
                              : 'bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="rounded text-indigo-600"
                              />
                              <span className="truncate">{mod.shortName}</span>
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                              {pricing.currencySymbol}
                              {displayPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {mod.code === 'MULTI_PROPERTY_CRS_7999' && checked && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 pl-6 text-[11px] font-mono"
                            >
                              <Building2 className="w-3 h-3 text-indigo-600" />
                              <span>Extra Outlets:</span>
                              <button
                                type="button"
                                onClick={() => setExtraOutlets((n) => Math.max(1, n - 1))}
                                className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 border"
                              >
                                -
                              </button>
                              <span>{extraOutlets}</span>
                              <button
                                type="button"
                                onClick={() => setExtraOutlets((n) => n + 1)}
                                className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 border"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-xs">
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDemoCompleted}
                      onChange={(e) => setLiveDemoCompleted(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Live On-Site Demo Conducted
                  </label>
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeTrialEnrolled}
                      onChange={(e) => setFreeTrialEnrolled(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Free Trial Enrolled
                  </label>
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUpsell}
                      onChange={(e) => setIsUpsell(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    90-Day Account Expansion / Upsell
                  </label>
                </div>
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
