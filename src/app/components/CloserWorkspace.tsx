'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Sparkles,
  Calendar,
  ExternalLink,
  Layers,
  Target,
  Send,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import {
  CloserDailyReportRecord,
  CloserLeadAssignmentRecord,
  CustomFieldDefinition,
  Employee,
  Lead,
  SalaryReport,
} from '@/types';
import {
  CLOSER_CONSTANTS,
  CLOSER_SELECTABLE_DISPOSITIONS,
  computeCloserBatchMetrics,
  getDispositionMeta,
  partitionCloserQueue,
} from '@/lib/closerEngine';
import { getLeadNetAnnualRevenue } from '@/lib/compensation';
import {
  submitCloserDailyReport,
  updateCloserAssignment,
} from '@/services/closerService';
import EditLeadModal from './EditLeadModal';

type Props = {
  closer: Employee;
  myReport: SalaryReport;
  employees: Employee[];
  leads: Lead[];
  assignments: CloserLeadAssignmentRecord[];
  dailyReports: CloserDailyReportRecord[];
  todayIST: string;
  customFieldDefs?: CustomFieldDefinition[];
};

type LocalDraft = {
  disposition: string;
  callAttempts: number;
  closerNotes: string;
  nextFollowUpDate: string;
};

export default function CloserWorkspace({
  closer,
  myReport,
  employees,
  leads,
  assignments,
  dailyReports,
  todayIST,
  customFieldDefs = [],
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'today' | 'carryover' | 'eod'>('today');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LocalDraft>>({});

  // Full Lead Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // EOD Form state
  const existingTodayReport = useMemo(
    () => dailyReports.find((r) => r.reportDate === todayIST) || null,
    [dailyReports, todayIST]
  );
  const [winsSummary, setWinsSummary] = useState(existingTodayReport?.winsSummary || '');
  const [topObjections, setTopObjections] = useState(existingTodayReport?.topObjections || '');
  const [tomorrowHotClosures, setTomorrowHotClosures] = useState(
    existingTodayReport?.tomorrowHotClosures || ''
  );
  const [supportNeededFromCoo, setSupportNeededFromCoo] = useState(
    existingTodayReport?.supportNeededFromCoo || ''
  );
  const [submittingEod, setSubmittingEod] = useState(false);

  const leadsMap = useMemo(() => new Map<string, Lead>(leads.map((l) => [l.leadId, l])), [leads]);

  const { todayBatch, carryOverQueue } = useMemo(
    () => partitionCloserQueue(assignments, leadsMap, todayIST),
    [assignments, leadsMap, todayIST]
  );

  const todayMetrics = useMemo(
    () => computeCloserBatchMetrics(todayBatch, leadsMap),
    [todayBatch, leadsMap]
  );

  const getDraft = (a: CloserLeadAssignmentRecord): LocalDraft => {
    if (drafts[a.id]) return drafts[a.id];
    const lead = leadsMap.get(a.leadId);
    return {
      disposition: a.disposition,
      callAttempts: a.callAttempts || 0,
      closerNotes: a.closerNotes || '',
      nextFollowUpDate: a.nextFollowUpDate || lead?.followUp || '',
    };
  };

  const patchDraft = (a: CloserLeadAssignmentRecord, patch: Partial<LocalDraft>) => {
    const current = getDraft(a);
    setDrafts((prev) => ({
      ...prev,
      [a.id]: { ...current, ...patch },
    }));
  };

  const handleSaveAssignment = async (a: CloserLeadAssignmentRecord, override?: Partial<LocalDraft>) => {
    const draft = { ...getDraft(a), ...(override || {}) };
    setSavingId(a.id);
    const res = await updateCloserAssignment({
      assignmentId: a.id,
      disposition: draft.disposition,
      callAttempts: draft.callAttempts,
      closerNotes: draft.closerNotes,
      nextFollowUpDate: draft.nextFollowUpDate,
    });
    setSavingId(null);

    if (res.success) {
      toast.success('Lead progress saved & synced with COO desk.');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update lead.');
    }
  };

  const handleQuickCall = async (a: CloserLeadAssignmentRecord) => {
    const current = getDraft(a);
    const nextCalls = current.callAttempts + 1;
    const nextDisp =
      current.disposition === 'UNWORKED' ? 'CALL_ATTEMPTED' : current.disposition;
    patchDraft(a, { callAttempts: nextCalls, disposition: nextDisp });
    await handleSaveAssignment(a, { callAttempts: nextCalls, disposition: nextDisp });
  };

  const handleSubmitEod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEod(true);
    const res = await submitCloserDailyReport({
      reportDate: todayIST,
      winsSummary,
      topObjections,
      tomorrowHotClosures,
      supportNeededFromCoo,
    });
    setSubmittingEod(false);
    if (res.success) {
      toast.success(
        todayMetrics.unworkedCount > 0
          ? `EOD Report submitted (${todayMetrics.unworkedCount} unworked lead${
              todayMetrics.unworkedCount === 1 ? '' : 's'
            } flagged to COO).`
          : 'EOD Report submitted cleanly to COO!'
      );
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to submit EOD report.');
    }
  };

  const getSetterName = (lead: Lead | undefined) => {
    if (!lead) return 'Unknown';
    return (
      employees.find((e) => e.id === lead.employeeId)?.name ||
      (lead.customFields as any)?.createdByName ||
      'Field Executive'
    );
  };

  const renderAssignmentCard = (a: CloserLeadAssignmentRecord, isCarryOver = false) => {
    const lead = leadsMap.get(a.leadId);
    const draft = getDraft(a);
    const meta = getDispositionMeta(
      lead?.status === 'Converted'
        ? 'CLOSED_WON'
        : lead?.status === 'Pending Verification' && draft.disposition !== 'CLOSED_WON'
        ? 'PENDING_VERIFICATION'
        : draft.disposition
    );
    const netValue = lead ? getLeadNetAnnualRevenue(lead) : 0;
    const phoneDigits = (lead?.phone || '').replace(/[^\d]/g, '');
    const waPhone =
      phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

    return (
      <div
        key={a.id}
        className={`rounded-2xl border p-4 md:p-5 transition-all space-y-4 ${
          draft.disposition === 'UNWORKED'
            ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* Top Row: Slot + Venue + Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white tabular-nums">
                {isCarryOver ? `Carry-Over (${a.batchDate})` : `Lead #${a.slotNumber}`}
              </span>
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                {lead?.name || 'Unknown Venue'}
              </h3>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
              >
                {meta.shortLabel}
              </span>
              {netValue > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                  ₹{netValue.toLocaleString('en-IN')}/yr
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Generated by: <strong className="text-gray-700 dark:text-gray-200">{getSetterName(lead)}</strong>
              </span>
              <span>
                CRM Stage: <strong className="text-gray-700 dark:text-gray-200">{lead?.status || 'Lead Captured'}</strong>
              </span>
              {lead?.email && <span>{lead.email}</span>}
            </div>
          </div>

          {/* Contact & Modal Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lead?.phone ? (
              <>
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Phone size={13} /> {lead.phone}
                </a>
                {waPhone.length >= 10 && (
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-bold hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle size={13} /> WA
                  </a>
                )}
              </>
            ) : (
              <span className="text-xs italic text-gray-400 px-2">No phone logged</span>
            )}
            {lead && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLead(lead);
                  setIsLeadModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <ExternalLink size={13} /> Full Lead &amp; Pricing
              </button>
            )}
          </div>
        </div>

        {/* COO Briefing & Field Context */}
        {(a.cooBriefingNote || lead?.notes || lead?.objections) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {a.cooBriefingNote && (
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                  COO Closing Brief
                </p>
                <p>{a.cooBriefingNote}</p>
              </div>
            )}
            {(lead?.notes || lead?.objections) && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Field Notes &amp; Objections
                </p>
                {lead?.notes && <p className="line-clamp-3 whitespace-pre-line">{lead.notes}</p>}
                {lead?.objections && (
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    Objection: {lead.objections}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fast Inline Closer Disposition Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Call Attempts
            </label>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                {draft.callAttempts}
              </span>
              <button
                type="button"
                disabled={savingId === a.id}
                onClick={() => handleQuickCall(a)}
                className="flex-1 px-2.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors disabled:opacity-50"
              >
                +1 Call
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Closing Disposition
            </label>
            <select
              value={draft.disposition}
              onChange={(e) => patchDraft(a, { disposition: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            >
              {CLOSER_SELECTABLE_DISPOSITIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
              {draft.disposition === 'CLOSED_WON' && (
                <option value="CLOSED_WON">Closed Won (Verified)</option>
              )}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Next Follow-Up
            </label>
            <input
              type="date"
              value={draft.nextFollowUpDate}
              onChange={(e) => patchDraft(a, { nextFollowUpDate: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Closing Notes / Outcome
            </label>
            <input
              type="text"
              value={draft.closerNotes}
              onChange={(e) => patchDraft(a, { closerNotes: e.target.value })}
              placeholder="Decision maker feedback, quote sent..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              disabled={savingId === a.id}
              onClick={() => handleSaveAssignment(a)}
              className="w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {savingId === a.id ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* HERO MISSION & COMPENSATION BANNER */}
      <section className="bg-gradient-to-r from-slate-950 via-indigo-950 to-emerald-950 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Target size={13} /> Closer Desk • {closer.name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Clock size={12} /> EOD Deadline: {CLOSER_CONSTANTS.EOD_DEADLINE_LABEL}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-black tracking-tight">
              Daily Closing Queue ({todayIST})
            </h1>
            <p className="text-xs text-slate-300">
              {myReport.tierStatusLabel ||
                '2-Month Probation ₹30,000/mo → Post-Probation ₹60,000/mo + 10% Closed Sales Incentive'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <IndianRupee size={11} /> Est. Cycle Payout
              </div>
              <div className="text-lg font-black text-emerald-300 tabular-nums">
                ₹{myReport.totalPayout.toLocaleString('en-IN')}
              </div>
            </div>
            <Link
              href="/earnings"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              View Earnings &amp; 10% Incentive →
            </Link>
          </div>
        </div>

        {/* 4 Daily KPI Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Today&apos;s 10-Lead Queue
            </p>
            <div className="flex items-baseline gap-2 mt-1 tabular-nums">
              <span className="text-2xl font-black text-white">
                {todayMetrics.workedCount}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                / {todayMetrics.assignedCount} worked
              </span>
            </div>
            {todayMetrics.unworkedCount > 0 ? (
              <p className="text-[11px] text-amber-300 mt-1 font-semibold">
                {todayMetrics.unworkedCount} unworked remaining today
              </p>
            ) : (
              <p className="text-[11px] text-emerald-300 mt-1 font-semibold">
                {todayMetrics.assignedCount > 0 ? 'All dispatched leads touched!' : 'Awaiting COO dispatch'}
              </p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Carry-Over Pipeline
            </p>
            <div className="flex items-baseline gap-2 mt-1 tabular-nums">
              <span className="text-2xl font-black text-sky-300">
                {carryOverQueue.length}
              </span>
              <span className="text-xs text-slate-300">active warm leads</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Follow-Ups &amp; Proposals (separate from daily 10)
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Closed Sales (This Cycle)
            </p>
            <div className="flex items-baseline gap-2 mt-1 tabular-nums">
              <span className="text-2xl font-black text-emerald-300">
                {myReport.conversions}
              </span>
              <span className="text-xs text-slate-300">
                (₹{(myReport.netRevenueThisMonth || 0).toLocaleString('en-IN')})
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/90 mt-1 font-semibold">
              10% Incentive: ₹{myReport.commission.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              EOD Report Status
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {existingTodayReport ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-black text-emerald-300">
                    Submitted ({existingTodayReport.isOnTime ? 'On-Time' : 'Late'})
                  </span>
                </>
              ) : (
                <>
                  <Clock size={18} className="text-amber-400 shrink-0" />
                  <span className="text-sm font-black text-amber-300">
                    Pending (9:00 PM IST)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {existingTodayReport?.cooReviewed
                ? `COO Rated: ${existingTodayReport.cooRating}`
                : 'Reviewed daily by COO / Management'}
            </p>
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'today'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Sparkles size={15} />
          1. Today&apos;s 10 Leads ({todayBatch.length}/10)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carryover')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'carryover'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Layers size={15} />
          2. Carry-Over Follow-Ups &amp; Proposals ({carryOverQueue.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eod')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'eod'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileText size={15} />
          3. EOD Report (Due 9:00 PM IST)
          {!existingTodayReport && (
            <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: TODAY'S 10 LEADS */}
      {activeTab === 'today' && (
        <section className="space-y-4">
          {todayBatch.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No Leads Dispatched for Today ({todayIST}) Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                The COO or Management will hand you your 10 daily leads shortly. Meanwhile, you can
                close active warm prospects in your <strong>Carry-Over Follow-Ups</strong> tab.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBatch.map((a) => renderAssignmentCard(a, false))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CARRY-OVER FOLLOW-UPS & PROPOSALS */}
      {activeTab === 'carryover' && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2.5">
            <Calendar size={16} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              Leads from previous days marked <strong>Follow-Up</strong>,{' '}
              <strong>Proposal Sent</strong>, <strong>Demo Scheduled</strong>, or{' '}
              <strong>Pending Verification</strong> stay right here until closed — they never reduce
              your 10 fresh leads each day.
            </span>
          </div>

          {carryOverQueue.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No active carry-over follow-ups or proposals yet. Any lead marked Follow-Up or Proposal
              Sent from your daily 10 will appear here on following days.
            </div>
          ) : (
            <div className="space-y-4">
              {carryOverQueue.map((a) => renderAssignmentCard(a, true))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: EOD DAILY REPORT */}
      {activeTab === 'eod' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Submit Form */}
          <form
            onSubmit={handleSubmitEod}
            className="lg:col-span-7 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-5"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-500" size={20} />
                  Submit EOD Report ({todayIST})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Deadline: <strong>9:00 PM IST</strong> • Objective counts are auto-synced from
                  today&apos;s 10-lead batch.
                </p>
              </div>
              {existingTodayReport && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Already Submitted (Updating)
                </span>
              )}
            </div>

            {/* Auto-Computed Objective Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-[10px] uppercase text-gray-500">Assigned</p>
                <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                  {todayMetrics.assignedCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300">Worked</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {todayMetrics.workedCount}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl border text-center ${
                  todayMetrics.unworkedCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                    : 'bg-gray-50 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'
                }`}
              >
                <p
                  className={`text-[10px] uppercase font-bold ${
                    todayMetrics.unworkedCount > 0
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-gray-500'
                  }`}
                >
                  Unworked
                </p>
                <p
                  className={`text-lg font-black tabular-nums ${
                    todayMetrics.unworkedCount > 0
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {todayMetrics.unworkedCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-[10px] uppercase text-indigo-700 dark:text-indigo-300">
                  Proposals / Verif.
                </p>
                <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {todayMetrics.proposalsSentCount} / {todayMetrics.sentForVerificationCount + todayMetrics.closedWonCount}
                </p>
              </div>
            </div>

            {todayMetrics.unworkedCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {todayMetrics.unworkedCount} of {todayMetrics.assignedCount} assigned leads are
                    still marked Unworked.
                  </p>
                  <p className="mt-0.5 opacity-90">
                    You can still submit your EOD report now, and this Unworked count will be
                    highlighted to the COO for review.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Key Wins, Demos &amp; Deals Progressed Today *
                </label>
                <textarea
                  required
                  rows={3}
                  value={winsSummary}
                  onChange={(e) => setWinsSummary(e.target.value)}
                  placeholder="Summarize deals closed/sent for verification, strong proposals pitched, and key breakthroughs..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Top Prospect Objections Encountered *
                </label>
                <textarea
                  required
                  rows={2}
                  value={topObjections}
                  onChange={(e) => setTopObjections(e.target.value)}
                  placeholder="Pricing resistance, competitor POS lock-in, owner availability, onboarding timeline..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Hot Closures &amp; Follow-Ups Planned for Tomorrow *
                </label>
                <textarea
                  required
                  rows={2}
                  value={tomorrowHotClosures}
                  onChange={(e) => setTomorrowHotClosures(e.target.value)}
                  placeholder="Venues expected to settle payment tomorrow, scheduled closing calls..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Support / Escalations Needed from COO (Optional)
                </label>
                <textarea
                  rows={2}
                  value={supportNeededFromCoo}
                  onChange={(e) => setSupportNeededFromCoo(e.target.value)}
                  placeholder="Custom multi-branch quotes, technical onboarding clarification, unworked reason..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingEod}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              <Send size={15} />
              {submittingEod
                ? 'Submitting EOD Report...'
                : existingTodayReport
                ? 'Update Today’s EOD Report'
                : 'Submit EOD Report to COO'}
            </button>
          </form>

          {/* Right: EOD History & COO Feedback */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Past EOD Reports &amp; COO Reviews
            </h3>
            {dailyReports.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-8 text-center">
                No EOD reports submitted yet. Your submitted reports and COO coaching feedback will
                appear here.
              </p>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {dailyReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {r.reportDate}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.isOnTime
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {r.isOnTime ? 'On-Time' : 'Late (>9 PM)'}
                        </span>
                        {r.unworkedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {r.unworkedCount} Unworked
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300">
                      Worked <strong>{r.workedCount}/{r.assignedCount}</strong> • Connected:{' '}
                      <strong>{r.connectedCount}</strong> • Proposals:{' '}
                      <strong>{r.proposalsSentCount}</strong> • Closed:{' '}
                      <strong>{r.closedWonCount}</strong>
                    </p>

                    {r.cooReviewed ? (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px]">COO Review</span>
                          <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-200/70 dark:bg-indigo-800">
                            {r.cooRating || 'REVIEWED'}
                          </span>
                        </div>
                        {r.cooFeedback && <p className="text-[11px]">{r.cooFeedback}</p>}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        Awaiting COO review &amp; feedback...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Lead & Modular Pricing Modal */}
      <EditLeadModal
        selectedLead={selectedLead}
        isOpen={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        employees={employees}
        customFieldDefs={customFieldDefs}
        isManager={false}
        initialMode="view"
        onLeadUpdated={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
