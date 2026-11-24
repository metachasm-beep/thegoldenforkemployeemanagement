'use client';

import { useState, useEffect, useRef } from 'react';
import { addLead, checkDuplicateLead } from '@/services/leadService';
import { Employee, CustomFieldDefinition } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mic, Loader2, Square, CheckCircle2, Sparkles, Building2, Globe } from 'lucide-react';
import CustomFieldsRenderer from './CustomFieldsRenderer';
import {
  PT_SALES_SCHEDULE_A,
  GOLDEN_FORK_REGIONS,
  PricingRegion,
  BillingModel,
  calculateModulesPricing,
} from '@/lib/compensation';

const OBJECTIONS_LIST = ['Price', 'Competitor', 'Timing', 'Authority', 'Feature Missing'];
const NEXT_ACTIONS = ['Call', 'Email', 'Demo', 'Contract', 'In-Person Meeting'];

export default function LeadForm({
  employees,
  customFieldDefs = [],
}: {
  employees: Employee[];
  customFieldDefs?: CustomFieldDefinition[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'single' | 'batch'>('single');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [objections, setObjections] = useState<string[]>([]);

  // Live thegoldenfork.de Modular Pricing Studio state
  const [pricingRegion, setPricingRegion] = useState<PricingRegion>('india');
  const [billingModel, setBillingModel] = useState<BillingModel>('annual_modular');
  const [selectedModules, setSelectedModules] = useState<string[]>(['CORE_POS_11999']);
  const [extraOutlets, setExtraOutlets] = useState<number>(1);
  const [liveDemoCompleted, setLiveDemoCompleted] = useState<boolean>(true);
  const [freeTrialEnrolled, setFreeTrialEnrolled] = useState<boolean>(false);
  const [isUpsell, setIsUpsell] = useState<boolean>(false);

  // AI Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    status: 'Lead Captured',
    nextAction: 'Demo',
    followUp: '',
    notes: '',
  });

  const pricing = calculateModulesPricing(selectedModules, {
    region: pricingRegion,
    billingModel,
    extraOutlets,
  });

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

  // Pre-fill smart follow up date based on status
  useEffect(() => {
    if (!formData.followUp) {
      const date = new Date();
      if (formData.status === 'Lead Captured') date.setDate(date.getDate() + 1);
      else if (formData.status === 'Proposal Sent') date.setDate(date.getDate() + 3);
      else date.setDate(date.getDate() + 7);
      setFormData((prev) => ({ ...prev, followUp: date.toISOString().split('T')[0] }));
    }
  }, [formData.status, formData.followUp]);

  // LocalStorage Draft
  useEffect(() => {
    const saved = localStorage.getItem('lead_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.objections) setObjections(parsed.objections);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lead_form_draft', JSON.stringify({ formData, objections }));
  }, [formData, objections]);

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email) {
      const isDuplicate = await checkDuplicateLead(email);
      if (isDuplicate)
        setDuplicateWarning('Warning: A lead with this email already exists in the system.');
      else setDuplicateWarning(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length >= 7) {
      val = `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6)}`;
    } else if (val.length >= 4) {
      val = `(${val.slice(0, 3)}) ${val.slice(3)}`;
    }
    setFormData((prev) => ({ ...prev, phone: val }));
  };

  const toggleObjection = (obj: string) => {
    setObjections((prev) => (prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Microphone error:', error);
      if (!navigator.mediaDevices) {
        toast.error('Microphone unavailable. This feature requires HTTPS or localhost.');
      } else {
        toast.error(`Microphone access failed: ${error.message || 'Denied'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleAudioProcessing = async (audioBlob: Blob) => {
    setIsProcessingAI(true);
    toast.loading('Processing voice log...', { id: 'ai-processing' });

    try {
      const fd = new FormData();
      fd.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/leads/transcribe', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        linkedIn: data.linkedIn || prev.linkedIn,
        status: data.status || prev.status,
        notes: data.notes || prev.notes,
        followUp: data.followUp || prev.followUp,
      }));

      if (data.customFields) {
        setCustomFieldValues((prev) => ({ ...prev, ...data.customFields }));
      }

      toast.success('Lead data extracted successfully!', { id: 'ai-processing' });
    } catch (error: any) {
      console.error(error);
      toast.error(`Processing Error: ${error.message || 'Unknown error'}`, {
        id: 'ai-processing',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formEl = e.currentTarget as HTMLFormElement;
    const fd = new FormData(formEl);
    fd.set('name', formData.name);
    fd.set('email', formData.email);
    fd.set('phone', formData.phone);
    fd.set('linkedIn', formData.linkedIn);
    fd.set('status', formData.status);
    fd.set('nextAction', formData.nextAction);
    fd.set('followUp', formData.followUp);
    fd.set('notes', formData.notes);
    fd.set('objections', objections.join(', '));
    fd.set('pricingRegion', pricingRegion);
    fd.set('billingModel', billingModel);
    fd.set('extraOutlets', String(extraOutlets));
    fd.set('subscribedModules', JSON.stringify(selectedModules));
    fd.set('netAnnualRevenue', String(pricing.netAnnualRevenue));
    fd.set('grossInvoiceWithGst', String(pricing.grossInvoiceWithGst));
    fd.set('liveDemoCompleted', String(liveDemoCompleted));
    fd.set('freeTrialEnrolled', String(freeTrialEnrolled));
    fd.set('isUpsell', String(isUpsell));

    if (employees.length > 0) fd.set('employeeId', employees[0].id);

    const res = await addLead(fd);

    if (res?.success) {
      toast.success('Lead Logged Successfully!');
      localStorage.removeItem('lead_form_draft');

      if (actionType === 'batch') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          linkedIn: '',
          status: 'Lead Captured',
          nextAction: 'Demo',
          followUp: '',
          notes: '',
        });
        setObjections([]);
        setDuplicateWarning(null);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      toast.error(res?.error || 'Failed to log lead.');
    }
    setLoading(false);
  };

  const hasPos = selectedModules.includes('CORE_POS_11999');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 min-h-[400px]">
      {/* AI Voice Recording Bar */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
            }`}
          >
            <Mic size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Voice Logging</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Record a detailed description of the venue visit &amp; live demo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessingAI}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30'
          } disabled:opacity-50`}
        >
          {isProcessingAI ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isRecording ? (
            <Square size={16} className="fill-current" />
          ) : (
            <Mic size={16} />
          )}
          {isProcessingAI ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="leadName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Venue / Lead Name
          </label>
          <input
            id="leadName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Restaurant, Café, Hotel, or Decision-Maker Name"
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow"
          />
        </div>
        <div>
          <label
            htmlFor="leadEmail"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Decision-Maker Email
          </label>
          <input
            id="leadEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={handleEmailBlur}
            placeholder="owner@venue.com"
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow"
          />
          {duplicateWarning && (
            <p className="text-orange-500 text-xs mt-1 font-medium animate-pulse">
              {duplicateWarning}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="leadPhone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Phone
          </label>
          <input
            id="leadPhone"
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(987) 654-3210"
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow"
          />
        </div>
        <div>
          <label
            htmlFor="leadLinkedIn"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Website / Maps / LinkedIn URL
          </label>
          <input
            id="leadLinkedIn"
            type="url"
            value={formData.linkedIn}
            onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
            placeholder="https://..."
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow"
          />
        </div>
      </div>

      {/* LIVE THEGOLDENFORK.DE MODULAR PRICING STUDIO */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                The Golden Fork Modular Subscription Studio (thegoldenfork.de)
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Replaced Flat ₹30k Plan
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select the venue&apos;s region, billing model, and modules demonstrated or subscribed.
            </p>
          </div>

          {/* Region Switcher (India ₹ / Europe € / North America $) */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 self-start">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1" />
            {GOLDEN_FORK_REGIONS.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setPricingRegion(reg.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  pricingRegion === reg.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Plan Presets from thegoldenfork.de */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBillingModel('annual_modular');
              setSelectedModules(['CORE_POS_11999']);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              billingModel === 'annual_modular' &&
              selectedModules.length === 1 &&
              selectedModules[0] === 'CORE_POS_11999'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              billingModel === 'annual_modular' &&
              selectedModules.length === 1 &&
              selectedModules[0] === 'HOTEL_PMS_14999'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              billingModel === 'annual_modular' && pricing.isAllInclusiveSuite
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            ★ All-in-One Suite ({pricing.currencySymbol}
            {pricingRegion === 'india' ? '34,999/yr' : pricingRegion === 'europe' ? '399/yr' : '499/yr'})
          </button>

          <button
            type="button"
            onClick={() => setBillingModel('monthly_2999')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              billingModel === 'monthly_2999'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
            }`}
          >
            Flexible Monthly ({pricing.currencySymbol}
            {pricingRegion === 'india' ? '2,999/mo' : pricingRegion === 'europe' ? '39/mo' : '49/mo'})
          </button>

          <button
            type="button"
            onClick={() => setBillingModel('payg_2_percent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              billingModel === 'payg_2_percent'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
            }`}
          >
            Pay-As-You-Go (2% Fee)
          </button>
        </div>

        {/* Live Pricing Summary Box */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                {billingModel === 'monthly_2999'
                  ? 'Monthly Subscription'
                  : billingModel === 'payg_2_percent'
                  ? 'Pay-As-You-Go Model'
                  : 'Net Annual Subscription (Excl. 18% GST)'}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {billingModel === 'payg_2_percent'
                    ? '2% Platform Fee (₹0 Upfront)'
                    : `${pricing.currencySymbol}${pricing.regionAmount.toLocaleString('en-IN')}${
                        billingModel === 'monthly_2999' ? '/mo' : '/yr'
                      }`}
                </p>
                {billingModel === 'annual_modular' && (
                  <span className="text-xs font-mono text-gray-500">
                    (~{pricing.currencySymbol}
                    {pricing.monthlyEquivalent.toLocaleString('en-IN')}/mo)
                  </span>
                )}
                {pricing.bundleSavings > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Saves {pricing.currencySymbol}
                    {pricing.bundleSavings.toLocaleString('en-IN')}/yr
                  </span>
                )}
              </div>
            </div>

            {pricingRegion === 'india' && billingModel !== 'payg_2_percent' && (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Gross Invoice (Incl. 18% GST)
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                    ₹{pricing.grossInvoiceWithGst.toLocaleString('en-IN')}
                  </p>
                </div>
              </>
            )}
          </div>

          {billingModel === 'annual_modular' && (
            <div className="flex items-center gap-3 text-xs font-mono bg-gray-50 dark:bg-gray-800/70 px-3 py-2 rounded-lg border border-gray-200/70 dark:border-gray-700">
              <span className="text-amber-700 dark:text-amber-300 font-bold">
                30% Under-Quota Comm: ₹{pricing.underQuotaCommission30.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                20% Over-Quota Accel: ₹{pricing.overQuotaAccelerator20.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Modular Studio Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PT_SALES_SCHEDULE_A.filter((m) => m.code !== 'HOTEL_PMS_BUNDLED_11999').map((mod) => {
            const active = selectedModules.includes(mod.code);
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
                className={`cursor-pointer p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-white dark:bg-gray-900 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                    : 'bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="rounded text-indigo-600 mt-0.5 shrink-0"
                    />
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {mod.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                    {isPmsWithPosDiscount && (
                      <span className="line-through text-gray-400 text-[11px]">
                        {pricing.currencySymbol}
                        {pricingRegion === 'india'
                          ? '14,999'
                          : pricingRegion === 'europe'
                          ? '179'
                          : '219'}
                      </span>
                    )}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {pricing.currencySymbol}
                      {displayPrice.toLocaleString('en-IN')}
                      {mod.code === 'MULTI_PROPERTY_CRS_7999' ? '/outlet/yr' : '/yr'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-6 line-clamp-1">
                  {mod.tagline}
                </p>

                {mod.code === 'MULTI_PROPERTY_CRS_7999' && active && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 ml-6 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Extra Outlets:</span>
                    <button
                      type="button"
                      onClick={() => setExtraOutlets((n) => Math.max(1, n - 1))}
                      className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      {extraOutlets}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExtraOutlets((n) => n + 1)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Field Demo & Trial Checkboxes */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={liveDemoCompleted}
              onChange={(e) => setLiveDemoCompleted(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Live On-Site Product Demo Conducted (Counts toward 15 Monthly Demo Gate)
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={freeTrialEnrolled}
              onChange={(e) => setFreeTrialEnrolled(e.target.checked)}
              className="rounded text-indigo-600"
            />
            Enrolled in Free Trial (thegoldenfork.de)
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isUpsell}
              onChange={(e) => setIsUpsell(e.target.checked)}
              className="rounded text-indigo-600"
            />
            90-Day Account Expansion / Module Upsell
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <div>
          <label
            htmlFor="leadStage"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Stage
          </label>
          <select
            id="leadStage"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="Lead Captured">Lead Captured</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="leadNextAction"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Next Action
          </label>
          <select
            id="leadNextAction"
            value={formData.nextAction}
            onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            {NEXT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="leadFollowUp"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Follow-up Date
          </label>
          <input
            id="leadFollowUp"
            type="date"
            value={formData.followUp}
            onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
            required
            className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Key Objections
        </label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIONS_LIST.map((obj) => (
            <button
              type="button"
              key={obj}
              onClick={() => toggleObjection(obj)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                objections.includes(obj)
                  ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}
            >
              {obj}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
          <span>Notes</span>
          <span className="text-xs text-gray-400 font-normal">Markdown supported</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="- Venue type & table/room count&#10;- Modules demonstrated&#10;- Decision maker contact & timestamped visit confirmation"
          className="focus:ring-2 focus:ring-blue-500 font-mono text-sm text-black dark:text-white w-full px-4 py-3 border rounded-lg outline-none h-32 dark:bg-gray-800 dark:border-gray-700 transition-shadow"
        ></textarea>
      </div>

      <CustomFieldsRenderer
        key={JSON.stringify(customFieldValues)}
        fields={customFieldDefs}
        entityType="LEAD"
        values={customFieldValues}
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          onClick={() => setActionType('single')}
          disabled={loading}
          className="flex-1 min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex justify-center items-center"
        >
          {loading && actionType === 'single' ? 'Saving...' : 'Log Lead'}
        </button>
        <button
          type="submit"
          onClick={() => setActionType('batch')}
          disabled={loading}
          className="flex-1 min-h-[44px] bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-70 flex justify-center items-center"
        >
          {loading && actionType === 'batch' ? 'Saving...' : 'Save & Add Another'}
        </button>
      </div>
    </form>
  );
}
