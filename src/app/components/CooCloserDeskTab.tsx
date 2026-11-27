'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users,
  Send,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
  FileText,
  TrendingUp,
  Phone,
  Target,
  UserPlus,
} from 'lucide-react';
import {
  CloserDailyReportRecord,
  CloserLeadAssignmentRecord,
  Employee,
  Lead,
} from '@/types';
import {
  CLOSER_CONSTANTS,
  computeCloserPerformanceScorecard,
  getDispositionMeta,
  selectSmartFillLeads,
} from '@/lib/closerEngine';
import { getLeadNetAnnualRevenue } from '@/lib/compensation';
import { toIstDateKey } from '@/lib/hiringMetrics';
import {
  dispatchCloserLeads,
  recycleCloserAssignment,
  removeAssignmentFromBatch,
  reviewCloserDailyReport,
} from '@/services/closerService';

type Props = {
  employees: Employee[];
  leads: Lead[];
  assignments: CloserLeadAssignmentRecord[];
  dailyReports: CloserDailyReportRecord[];
  isFounder: boolean;
  isCoo: boolean;
};

export default function CooCloserDeskTab({
  employees,
  leads,
  assignments,
  dailyReports,
  isFounder,
}: Props) {
  const router = useRouter();
  const todayIST = useMemo(() => toIstDateKey(new Date()), []);

  const closers = useMemo(
    () => employees.filter((e) => e.role === 'Closer'),
    [employees]
  );

  const [subTab, setSubTab] = useState<'dispatch' | 'performance' | 'eod_reviews'>('dispatch');
  const [selectedCloserId, setSelectedCloserId] = useState<string>(closers[0]?.id || '');
  const [batchDate, setBatchDate] = useState<string>(todayIST);

  // Dispatcher pool filters & selection
  const [poolSearch, setPoolSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'Proposal Sent' | 'Lead Captured'>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(true);
  const [unassignedCloserOnly, setUnassignedCloserOnly] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [briefingNotes, setBriefingNotes] = useState<Record<string, string>>({});
  const [batchTip, setBatchTip] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // EOD Review state
  const [eodFilter, setEodFilter] = useState<'pending' | 'all'>('all');
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { rating: string; feedback: string }>
  >({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const leadsMap = useMemo(() => new Map<string, Lead>(leads.map((l) => [l.leadId, l])), [leads]);
  const empMap = useMemo(() => new Map<string, Employee>(employees.map((e) => [e.id, e])), [employees]);

  const activeCloserId = selectedCloserId || closers[0]?.id || '';
  const activeCloser = closers.find((c) => c.id === activeCloserId) || null;

  // Current dispatched batch for selectedCloserId + batchDate
  const currentBatch = useMemo(
    () =>
      assignments
        .filter(
          (a) =>
            a.closerId === activeCloserId &&
            a.batchDate === batchDate &&
            !a.isRecycled
        )
        .sort((a, b) => a.slotNumber - b.slotNumber),
    [assignments, activeCloserId, batchDate]
  );

  const remainingSlots = Math.max(
    0,
    CLOSER_CONSTANTS.DAILY_LEAD_QUOTA - currentBatch.length
  );

  // Lead IDs already dispatched on batchDate to any Closer (prevent duplicate same-day dispatch)
  const dispatchedOnBatchDateLeadIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((a) => a.batchDate === batchDate && !a.isRecycled)
          .map((a) => a.leadId)
      ),
    [assignments, batchDate]
  );

  // Eligible open pool for dispatching
  const eligibleLeads = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    return leads
      .filter((l) => {
        if (l.status === 'Converted' || l.status === 'Lost') return false;
        if (dispatchedOnBatchDateLeadIds.has(l.leadId)) return false;
        if (stageFilter !== 'all' && l.status !== stageFilter) return false;
        if (hasPhoneOnly && (!l.phone || l.phone.trim().length < 7)) return false;
        if (unassignedCloserOnly && l.closerId) return false;
        if (q) {
          const setter =
            empMap.get(l.employeeId)?.name ||
            (l.customFields as any)?.createdByName ||
            '';
          const matches =
            l.name.toLowerCase().includes(q) ||
            (l.phone || '').toLowerCase().includes(q) ||
            (l.notes || '').toLowerCase().includes(q) ||
            setter.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [
    leads,
    dispatchedOnBatchDateLeadIds,
    stageFilter,
    hasPhoneOnly,
    unassignedCloserOnly,
    poolSearch,
    empMap,
  ]);

  // Scorecards per Closer
  const scorecards = useMemo(() => {
    const now = new Date();
    return closers.map((c) => ({
      closer: c,
      card: computeCloserPerformanceScorecard(
        c.id,
        assignments,
        dailyReports,
        leads,
        now,
        c.commissionRate || CLOSER_CONSTANTS.INCENTIVE_PERCENT
      ),
    }));
  }, [closers, assignments, dailyReports, leads]);

  // Pending EOD reviews count
  const pendingReviewsCount = useMemo(
    () => dailyReports.filter((r) => !r.cooReviewed).length,
    [dailyReports]
  );

  // Closers who received leads today but haven't submitted EOD yet
  const missingTodayEodClosers = useMemo(() => {
    return scorecards.filter(
      ({ card }) => card.todayAssigned > 0 && !card.eodSubmittedToday
    );
  }, [scorecards]);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      if (prev.includes(leadId)) {
        return prev.filter((id) => id !== leadId);
      }
      if (prev.length >= remainingSlots) {
        toast.error(
          `Daily cap is ${CLOSER_CONSTANTS.DAILY_LEAD_QUOTA} leads. Only ${remainingSlots} slot(s) remaining for ${batchDate}.`
        );
        return prev;
      }
      return [...prev, leadId];
    });
  };

  const handleSmartFill = () => {
    if (remainingSlots <= 0) {
      toast.info('Today’s 10-lead batch is already full!');
      return;
    }
    const alreadyPicked = new Set(selectedLeadIds);
    const needed = Math.max(0, remainingSlots - selectedLeadIds.length);
    if (needed === 0) {
      toast.info(`Already selected ${selectedLeadIds.length} lead(s) to fill to 10.`);
      return;
    }
    const candidates = eligibleLeads.filter((l) => !alreadyPicked.has(l.leadId));
    const picked = selectSmartFillLeads(candidates, needed);
    if (picked.length === 0) {
      toast.error('No additional eligible leads match the current pool filters.');
      return;
    }
    setSelectedLeadIds((prev) => [...prev, ...picked.map((l) => l.leadId)]);
    toast.success(`Smart-selected ${picked.length} top-priority lead(s). Review & click Dispatch.`);
  };

  const handleDispatch = async () => {
    if (!activeCloserId) {
      toast.error('Select a Closer first.');
      return;
    }
    if (selectedLeadIds.length === 0) {
      toast.error('Select at least 1 lead to dispatch.');
      return;
    }
    setDispatching(true);
    const mergedNotes: Record<string, string> = {};
    for (const id of selectedLeadIds) {
      const note = (briefingNotes[id] || batchTip || '').trim();
      if (note) mergedNotes[id] = note;
    }

    const res = await dispatchCloserLeads({
      closerId: activeCloserId,
      leadIds: selectedLeadIds,
      batchDate,
      briefingNotes: mergedNotes,
    });
    setDispatching(false);

    if (res.success) {
      toast.success(
        `Dispatched ${res.dispatchedCount} lead(s) to ${activeCloser?.name} (${res.totalForDay}/10 for ${batchDate}).`
      );
      setSelectedLeadIds([]);
      setBriefingNotes({});
      setBatchTip('');
      router.refresh();
    } else {
      toast.error(res.error || 'Dispatch failed.');
    }
  };

  const handleReviewSubmit = async (reportId: string) => {
    const draft = reviewDrafts[reportId] || { rating: 'MEETS', feedback: '' };
    setReviewingId(reportId);
    const res = await reviewCloserDailyReport({
      reportId,
      cooRating: draft.rating,
      cooFeedback: draft.feedback,
    });
    setReviewingId(null);
    if (res.success) {
      toast.success('EOD Report reviewed & feedback sent to Closer.');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to save review.');
    }
  };

  if (closers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <UserPlus size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          No Closer Staff Onboarded Yet
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Onboard your first <strong>Closer</strong> in Team Directory (2-month probation at
          ₹30,000/mo → ₹60,000/mo post-probation + 10% closed sales incentive). Once added, you can
          hand them 10 daily leads and review their 9:00 PM IST EOD reports right here.
        </p>
        <Link
          href="/team"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors"
        >
          <UserPlus size={16} /> Onboard Closer in Team Directory
        </Link>
      </div>
    );
  }

  const filteredReports = dailyReports.filter((r) =>
    eodFilter === 'pending' ? !r.cooReviewed : true
  );

  return (
    <div className="space-y-6">
      {/* Sub-Navigation & Supervisor Role Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('dispatch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              subTab === 'dispatch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Send size={14} /> Daily 10-Lead Dispatcher
          </button>
          <button
            type="button"
            onClick={() => setSubTab('performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              subTab === 'performance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp size={14} /> Closer Performance Monitor ({closers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('eod_reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              subTab === 'eod_reviews'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FileText size={14} /> EOD Reports (9 PM IST)
            {pendingReviewsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {pendingReviewsCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start md:self-auto">
          {isFounder ? 'Manager / Founder Fallback Controls Active' : 'COO Closer Governance Desk'}
        </span>
      </div>

      {/* SUB-TAB 1: DAILY 10-LEAD DISPATCHER */}
      {subTab === 'dispatch' && (
        <div className="space-y-5">
          {/* Closer & Date Picker Bar */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Target Closer
                </label>
                <select
                  value={activeCloserId}
                  onChange={(e) => {
                    setSelectedCloserId(e.target.value);
                    setSelectedLeadIds([]);
                  }}
                  className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  {closers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Batch Date (IST)
                </label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => {
                    setBatchDate(e.target.value);
                    setSelectedLeadIds([]);
                  }}
                  className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono font-semibold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Dispatched for {batchDate}
                </p>
                <p className="text-xl font-black text-indigo-900 dark:text-white tabular-nums">
                  {currentBatch.length} / {CLOSER_CONSTANTS.DAILY_LEAD_QUOTA}
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Remaining Slots
                </p>
                <p className="text-xl font-black text-amber-800 dark:text-amber-300 tabular-nums">
                  {remainingSlots}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Dispatched Batch (Slots 1-10) */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target size={18} className="text-indigo-500" />
                  {activeCloser?.name}&apos;s Batch ({currentBatch.length}/10)
                </h3>
                <span className="text-[11px] font-mono text-gray-400">{batchDate}</span>
              </div>

              {currentBatch.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400">
                  No leads dispatched yet for {batchDate}. Select up to 10 leads on the right or
                  click <strong>Smart Fill to 10</strong>.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {currentBatch.map((a) => {
                    const lead = leadsMap.get(a.leadId);
                    const meta = getDispositionMeta(
                      lead?.status === 'Converted' ? 'CLOSED_WON' : a.disposition
                    );
                    return (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-slate-900 dark:bg-indigo-600 text-white">
                                #{a.slotNumber}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white truncate">
                                {lead?.name || 'Lead'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                              >
                                {meta.shortLabel}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Calls: <strong>{a.callAttempts}</strong>
                              </span>
                              {lead?.phone && (
                                <span className="text-[10px] font-mono text-gray-500">
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {a.disposition === 'UNWORKED' && (
                              <button
                                type="button"
                                title="Remove from today's batch to swap another lead"
                                onClick={async () => {
                                  const res = await removeAssignmentFromBatch(a.id);
                                  if (res.success) {
                                    toast.success('Removed from batch.');
                                    router.refresh();
                                  } else {
                                    toast.error(res.error || 'Failed');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {lead?.status !== 'Converted' && (
                              <button
                                type="button"
                                title="Recycle lead back to Open Pool"
                                onClick={async () => {
                                  const res = await recycleCloserAssignment(a.id);
                                  if (res.success) {
                                    toast.success('Lead recycled back to open pool.');
                                    router.refresh();
                                  } else {
                                    toast.error(res.error || 'Failed');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {a.cooBriefingNote && (
                          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                            Brief: {a.cooBriefingNote}
                          </p>
                        )}
                        {a.closerNotes && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 italic">
                            Closer Note: &ldquo;{a.closerNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Eligible Lead Pool Picker */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Eligible Open Lead Pool ({eligibleLeads.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Handing a lead sets Closer ownership while preserving the original lead creator.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={remainingSlots <= 0}
                    onClick={handleSmartFill}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition-colors disabled:opacity-40"
                  >
                    <Sparkles size={14} /> Smart Fill to 10
                  </button>
                  <button
                    type="button"
                    disabled={dispatching || selectedLeadIds.length === 0 || remainingSlots <= 0}
                    onClick={handleDispatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-40"
                  >
                    <Send size={14} />
                    {dispatching
                      ? 'Dispatching...'
                      : `Dispatch (${selectedLeadIds.length})`}
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5 relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={poolSearch}
                    onChange={(e) => setPoolSearch(e.target.value)}
                    placeholder="Search venue, phone, notes, creator..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none"
                  >
                    <option value="all">All Open Stages</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Lead Captured">Lead Captured</option>
                  </select>
                </div>
                <div className="sm:col-span-4 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPhoneOnly}
                      onChange={(e) => setHasPhoneOnly(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Has Phone
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unassignedCloserOnly}
                      onChange={(e) => setUnassignedCloserOnly(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Unassigned
                  </label>
                </div>
              </div>

              {/* Optional Batch-Wide Briefing Note */}
              <input
                type="text"
                value={batchTip}
                onChange={(e) => setBatchTip(e.target.value)}
                placeholder="Optional COO briefing note for selected batch (e.g. Pitch POS+PMS ₹23,998 combo)..."
                className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />

              {/* Lead Selection List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {eligibleLeads.slice(0, 80).map((lead) => {
                  const checked = selectedLeadIds.includes(lead.leadId);
                  const creatorName =
                    empMap.get(lead.employeeId)?.name ||
                    (lead.customFields as any)?.createdByName ||
                    'Field Exec';
                  const netVal = getLeadNetAnnualRevenue(lead);
                  return (
                    <div
                      key={lead.leadId}
                      onClick={() => toggleLeadSelection(lead.leadId)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3 text-xs ${
                        checked
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600'
                          : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-indigo-600"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white truncate">
                            {lead.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                              {lead.status}
                            </span>
                            {netVal > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                ₹{netVal.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {lead.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone size={10} /> {lead.phone}
                            </span>
                          )}
                          <span>Creator: {creatorName}</span>
                          <span>Logged: {lead.date}</span>
                        </div>
                        {lead.notes && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1 italic">
                            &ldquo;{lead.notes}&rdquo;
                          </p>
                        )}
                        {checked && (
                          <input
                            type="text"
                            onClick={(e) => e.stopPropagation()}
                            value={briefingNotes[lead.leadId] || ''}
                            onChange={(e) =>
                              setBriefingNotes((prev) => ({
                                ...prev,
                                [lead.leadId]: e.target.value,
                              }))
                            }
                            placeholder="Optional specific brief for this lead..."
                            className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-[11px]"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                {eligibleLeads.length === 0 && (
                  <p className="text-center py-8 text-xs text-gray-400 italic">
                    No open leads match the selected filters. Try unchecking &ldquo;Has Phone&rdquo;
                    or &ldquo;Unassigned&rdquo;.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CLOSER PERFORMANCE MONITOR */}
      {subTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scorecards.map(({ closer, card }) => (
              <div
                key={closer.id}
                className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {closer.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Closer
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{closer.email}</p>
                  </div>
                  <div className="text-right">
                    {card.eodSubmittedToday ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 size={12} /> EOD Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <Clock size={12} /> EOD Pending
                      </span>
                    )}
                    {card.todayUnworked > 0 && (
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                        ⚠ {card.todayUnworked} unworked today
                      </p>
                    )}
                  </div>
                </div>

                {/* Today Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-600 dark:text-gray-300">
                      Today&apos;s Daily Queue ({todayIST})
                    </span>
                    <span className="tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                      {card.todayWorked} / {card.todayAssigned} worked • {card.carryOverActiveCount}{' '}
                      carry-over
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        card.todayAssigned > 0 && card.todayWorked >= card.todayAssigned
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${
                          card.todayAssigned > 0
                            ? Math.min(100, Math.round((card.todayWorked / card.todayAssigned) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Monthly Metrics Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">Touch %</p>
                    <p className="font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
                      {card.touchCompletionRatePct}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">Connect %</p>
                    <p className="font-black text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
                      {card.connectRatePct}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">Close %</p>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      {card.closeRatePct}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">Won (Mo)</p>
                    <p className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                      {card.monthClosedWon}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">1st Touch</p>
                    <p className="font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
                      {card.avgTimeToFirstTouchMins !== null
                        ? `${card.avgTimeToFirstTouchMins}m`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <p className="text-[10px] text-gray-500">EOD On-Time</p>
                    <p className="font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                      {card.eodOnTimeCount}/{card.eodTotalReports}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-gray-500">
                    Settled Month Revenue:{' '}
                    <strong className="text-gray-900 dark:text-white tabular-nums">
                      ₹{card.monthNetRevenue.toLocaleString('en-IN')}
                    </strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    10% Incentive: ₹{card.monthIncentiveInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EOD REPORTS REVIEW & COACHING */}
      {subTab === 'eod_reviews' && (
        <div className="space-y-4">
          {missingTodayEodClosers.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">
                  Pending EOD Reports for Today ({todayIST} • Deadline 9:00 PM IST):
                </p>
                <p className="mt-1">
                  {missingTodayEodClosers
                    .map(
                      ({ closer, card }) =>
                        `${closer.name} (${card.todayWorked}/${card.todayAssigned} worked, ${card.todayUnworked} unworked)`
                    )
                    .join(' • ')}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-500" />
              Closer EOD Reports Ledger
            </h3>
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setEodFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  eodFilter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                All ({dailyReports.length})
              </button>
              <button
                type="button"
                onClick={() => setEodFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  eodFilter === 'pending'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Pending Review ({pendingReviewsCount})
              </button>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl border border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400 italic">
              No EOD reports match this filter yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((r) => {
                const closer = empMap.get(r.closerId);
                const reviewer = r.cooReviewedById ? empMap.get(r.cooReviewedById) : null;
                const draft = reviewDrafts[r.id] || {
                  rating: (r.cooRating as string) || 'MEETS',
                  feedback: r.cooFeedback || '',
                };

                return (
                  <div
                    key={r.id}
                    className={`bg-white dark:bg-gray-900 p-5 rounded-3xl border shadow-sm space-y-4 ${
                      r.unworkedCount > 0
                        ? 'border-amber-300 dark:border-amber-800'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    {/* Header with Highlighted Unworked Alert */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-base text-gray-900 dark:text-white">
                          {closer?.name || 'Closer'}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                          {r.reportDate}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            r.isOnTime
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {r.isOnTime ? 'On-Time (≤ 9:00 PM IST)' : 'Late (> 9:00 PM IST)'}
                        </span>
                        {r.unworkedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                            <AlertTriangle size={12} /> {r.unworkedCount} UNWORKED LEADS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 size={12} /> 100% Queue Touched
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-gray-400">
                        Submitted{' '}
                        {new Date(r.submittedAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        IST
                      </span>
                    </div>

                    {/* System-Verified CRM Counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                        <p className="text-[10px] text-gray-500">Assigned</p>
                        <p className="font-black tabular-nums">{r.assignedCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Worked</p>
                        <p className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {r.workedCount}
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-xl ${
                          r.unworkedCount > 0
                            ? 'bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800'
                            : 'bg-gray-50 dark:bg-gray-800/60'
                        }`}
                      >
                        <p
                          className={`text-[10px] font-bold ${
                            r.unworkedCount > 0
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-gray-500'
                          }`}
                        >
                          Unworked
                        </p>
                        <p
                          className={`font-black tabular-nums ${
                            r.unworkedCount > 0 ? 'text-rose-700 dark:text-rose-300' : ''
                          }`}
                        >
                          {r.unworkedCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40">
                        <p className="text-[10px] text-sky-700 dark:text-sky-300">Connected</p>
                        <p className="font-black text-sky-700 dark:text-sky-300 tabular-nums">
                          {r.connectedCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Proposals</p>
                        <p className="font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                          {r.proposalsSentCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40">
                        <p className="text-[10px] text-violet-700 dark:text-violet-300">Verif / Won</p>
                        <p className="font-black text-violet-700 dark:text-violet-300 tabular-nums">
                          {r.sentForVerificationCount} / {r.closedWonCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Closed Rev</p>
                        <p className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                          ₹{Math.round(r.netRevenueClosed).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Narrative Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-500">
                          Key Wins &amp; Deals Progressed
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {r.winsSummary || '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-500">
                          Top Objections
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {r.topObjections || '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-500">
                          Tomorrow&apos;s Hot Closures
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {r.tomorrowHotClosures || '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-500">
                          Support Needed from COO
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {r.supportNeededFromCoo || 'None noted'}
                        </p>
                      </div>
                    </div>

                    {/* COO / Manager Review & Feedback Controls */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                      <div className="md:w-48">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                          Performance Rating
                        </label>
                        <select
                          value={draft.rating}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({
                              ...prev,
                              [r.id]: { ...draft, rating: e.target.value },
                            }))
                          }
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none"
                        >
                          <option value="EXCEEDS">Exceeds Expectations</option>
                          <option value="MEETS">Meets Expectations</option>
                          <option value="NEEDS_COACHING">Needs Coaching</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                          COO / Manager Coaching Feedback
                        </label>
                        <input
                          type="text"
                          value={draft.feedback}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({
                              ...prev,
                              [r.id]: { ...draft, feedback: e.target.value },
                            }))
                          }
                          placeholder="Add coaching notes, deal strategy tips, or follow-up instructions..."
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={reviewingId === r.id}
                        onClick={() => handleReviewSubmit(r.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50"
                      >
                        {reviewingId === r.id
                          ? 'Saving...'
                          : r.cooReviewed
                          ? `Update Review (${reviewer?.name || 'Reviewed'})`
                          : 'Acknowledge & Send Feedback'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
