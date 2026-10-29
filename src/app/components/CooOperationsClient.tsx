'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  Scale,
  IndianRupee,
  Calculator,
  Sparkles,
  Award,
  Lock,
  PauseCircle,
} from 'lucide-react';
import {
  COO_PILLARS,
  GOLDEN_FORK_MODULES,
  COO_CONTRACT_CONSTANTS,
  calculateCooVesting,
  calculateCooBuybackPrice,
  CooTerminationType,
} from '@/lib/cooCompensation';
import {
  startCooWorkSession,
  stopCooWorkSession,
  toggleVerifyCooSession,
  submitCooWeeklyReport,
  acknowledgeCooWeeklyReport,
  upsertMerchantDeployment,
  updateMerchantStage,
  verifyFieldDemoByCoo,
  upsertFounderMonthlyRevenueLedger,
} from '@/services/cooService';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
  isFounder: boolean;
  isCoo: boolean;
  cooEmployee: any;
  sessions: any[];
  weeklyReports: any[];
  monthlyLedgers: any[];
  deployments: any[];
  leads: any[];
  employees: any[];
};

export default function CooOperationsClient({
  isFounder,
  isCoo,
  cooEmployee,
  sessions,
  weeklyReports,
  monthlyLedgers,
  deployments,
  leads,
  employees,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'timer' | 'onboarding' | 'field_qa' | 'weekly_reports' | 'vesting_buyback'
  >('timer');

  // Active session detection
  const activeSession = sessions.find((s) => s.status === 'ACTIVE');
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(activeSession?.durationMinutes || 0);
  const [lastActivityTs, setLastActivityTs] = useState<number>(Date.now());
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Interactive Buyback & Vesting Simulator state
  const [simulatedTermination, setSimulatedTermination] = useState<CooTerminationType>('NONE');
  const [simulatedCompanyFmv, setSimulatedCompanyFmv] = useState<number>(50000000); // Default ₹5 Cr

  // Selected modules in Venue Onboarding form
  const [selectedModules, setSelectedModules] = useState<string[]>(['CORE_POS_11999']);

  // Track user interaction for 15-minute anti-idle protection (Section 2.3 & 4.4)
  useEffect(() => {
    if (!activeSession) return;
    const updateActivity = () => setLastActivityTs(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [activeSession]);

  // 2-minute heartbeat to /api/coo/heartbeat while session is ACTIVE
  useEffect(() => {
    if (!activeSession) return;
    const updateLocalClock = () => {
      const mins = Math.max(
        1,
        Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000)
      );
      setElapsedMinutes(mins);
    };
    updateLocalClock();

    const timer = setInterval(async () => {
      updateLocalClock();
      const idleMs = Date.now() - lastActivityTs;
      try {
        const res = await fetch('/api/coo/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSession.id, idleMs }),
        });
        const data = await res.json();
        if (data.status === 'AUTO_PAUSED_IDLE') {
          toast.warning(
            'Work session auto-paused after 15 minutes of CRM inactivity (Section 2.3 verification).'
          );
          router.refresh();
        }
      } catch {
        // Ignore transient network errors
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [activeSession, lastActivityTs, router]);

  // Compute current week & current month metrics
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayDate = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
  const currentWeekStartStr = mondayDate.toISOString().slice(0, 10);
  const sundayDate = new Date(mondayDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const currentWeekEndStr = sundayDate.toISOString().slice(0, 10);

  const verifiedSessions = sessions.filter((s) => s.verifiedByFounder !== false);
  const thisWeekMinutes = verifiedSessions
    .filter((s) => {
      const dStr = new Date(s.startedAt).toISOString().slice(0, 10);
      return dStr >= currentWeekStartStr && dStr <= currentWeekEndStr;
    })
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const thisWeekHours = Number((thisWeekMinutes / 60).toFixed(2));

  const thisMonthMinutes = verifiedSessions
    .filter((s) => new Date(s.startedAt).toISOString().slice(0, 7) === currentMonthStr)
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const thisMonthHours = Number((thisMonthMinutes / 60).toFixed(2));

  // Completed Months & Vesting calculation
  const completedMonthsCount = monthlyLedgers.filter((m) => m.qualifiesAsCompletedMonth).length;
  const vestingState = calculateCooVesting({
    completedMonths: completedMonthsCount,
    terminationType: simulatedTermination,
    forCauseBreach: simulatedTermination === 'FOR_CAUSE',
  });

  // Trailing 12 Months (TTM) Realized Payouts
  const ttmRealizedPayouts = monthlyLedgers
    .slice(0, 12)
    .reduce((acc, m) => acc + (m.grossCooPayout || 0), 0);

  const buybackValuation = calculateCooBuybackPrice({
    completedMonths: completedMonthsCount,
    survivingRevenueSharePercent: vestingState.survivingRevenueSharePercent,
    companyFmv: simulatedCompanyFmv,
    ttmRealizedPayouts,
  });

  // Demo verification metrics
  const verifiedDemosCount = leads.filter(
    (l) => (l.customFields as any)?.cooDemoVerified === true
  ).length;
  const activeTrialsCount = deployments.filter(
    (d) => d.onboardingStatus === 'TRIAL_21_DAY'
  ).length;
  const liveVenuesCount = deployments.filter((d) => d.onboardingStatus === 'LIVE_ACTIVE').length;

  const toggleModuleSelection = (code: string) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const calculatedModuleAcv = selectedModules.reduce((sum, code) => {
    const found = GOLDEN_FORK_MODULES.find((m) => m.code === code);
    return sum + (found ? found.annualPrice : 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0 pb-12">
      {/* EXECUTIVE CONTRACT HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Contractual COO Governance Hub
              </span>
              <span className="text-xs font-mono text-indigo-200 bg-indigo-900/50 px-2.5 py-1 rounded-md border border-indigo-700/50">
                Ref: {COO_CONTRACT_CONSTANTS.DOCUMENT_REF}
              </span>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-900/40 px-2.5 py-1 rounded-md border border-emerald-700/40">
                Effective: 29/10/2026
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white">
              {cooEmployee?.name || 'Ankur Otto'} — Chief Operating Officer (Contractual)
            </h1>
            <p className="text-xs md:text-sm text-indigo-200 max-w-3xl">
              Principal: <strong>Metachasm Enterprises (Paul Marandi, Sole Proprietor)</strong> • PAN:{' '}
              <span className="font-mono">{COO_CONTRACT_CONSTANTS.EXECUTIVE_PAN}</span> • Pure 3.00%
              Net Realized Monthly Revenue Share (₹0 Fixed Retainer) • 18-Month Graded Vesting
            </p>
          </div>

          {/* LIVE SESSION STATUS BADGE */}
          <div className="flex items-center gap-3 self-stretch lg:self-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            {activeSession ? (
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                    Active Session Running ({elapsedMinutes} mins)
                  </p>
                  <p className="text-sm font-semibold text-white truncate max-w-[220px]">
                    {activeSession.taskTitle}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-300" size={22} />
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold">
                    Session Timer Standby
                  </p>
                  <p className="text-xs text-gray-300">15-min Auto-Idle Verification Active</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 CONTRACTUAL KPI METERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Weekly 15h Commitment */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
              <span>Weekly Hours (Sec 2.2)</span>
              <span className="font-mono font-bold text-white">
                {thisWeekHours} / {COO_CONTRACT_CONSTANTS.MIN_WEEKLY_HOURS}h min
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all ${
                  thisWeekHours >= 15 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (thisWeekHours / 15) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-200">
              Week of {currentWeekStartStr} • Report due Mon 10:00 AM IST
            </p>
          </div>

          {/* Monthly 60h Qualification / 80h Target */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
              <span>Monthly Vesting Hours (Sec 2.3)</span>
              <span className="font-mono font-bold text-white">
                {thisMonthHours} / 60h min (80h target)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all ${
                  thisMonthHours >= 80
                    ? 'bg-emerald-400'
                    : thisMonthHours >= 60
                    ? 'bg-blue-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (thisMonthHours / 80) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-200">
              {thisMonthHours >= 60
                ? '✓ Meets 60h Completed Month threshold'
                : `${(60 - thisMonthHours).toFixed(1)}h remaining to qualify month`}
            </p>
          </div>

          {/* 18-Month Graded Vesting Clock */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
              <span>Graded Vesting Clock (Sec 4.2)</span>
              <span className="font-mono font-bold text-amber-300">
                {completedMonthsCount} / 18 Months
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completedMonthsCount / 18) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-200">
              Surviving Share: <strong>{vestingState.survivingRevenueSharePercent}%</strong> (Active:
              3.00%)
            </p>
          </div>

          {/* Operational Footprint */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
              <span>Operational Pillars Footprint</span>
              <span className="font-mono font-bold text-emerald-300">
                {liveVenuesCount} Live • {activeTrialsCount} Trials
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-1">
              {verifiedDemosCount} Field Demos Verified
            </p>
            <p className="text-[11px] text-indigo-200 mt-1">
              Fiduciary Expense Limit: ≤ ₹10,000 (Sec 1.3)
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        {[
          { id: 'timer', label: '1. Work-Time & 5-Pillar Tracker', icon: Clock },
          { id: 'onboarding', label: '2. Venue Onboarding & 21-Day Trials', icon: Building2 },
          { id: 'field_qa', label: '3. Field Demo QA & Verification', icon: ShieldCheck },
          { id: 'weekly_reports', label: '4. Monday 10 AM Weekly Reports', icon: FileText },
          { id: 'vesting_buyback', label: '5. Vesting, 3% Revenue & Buyback', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORK-TIME & 5-PILLAR SESSION TRACKER */}
      {activeTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Start / Stop Work Session Control */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-indigo-500" size={20} />
              In-House CRM Time Tracker (Sec 2.3)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Log active operational hours across the 5 Contractual Pillars. Sessions automatically
              verify user activity and auto-pause after 15 minutes of inactivity.
            </p>

            {activeSession ? (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Session in Progress
                  </span>
                  <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {elapsedMinutes} mins
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Pillar</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {COO_PILLARS.find((p) => p.code === activeSession.pillar)?.shortLabel ||
                      activeSession.pillar}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Task / Merchant</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {activeSession.taskTitle}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Session Outcome / Deliverables Completed
                  </label>
                  <textarea
                    rows={3}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Document configurations completed, demos audited, or merchant escalations resolved..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs"
                  />
                </div>
                <button
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    await stopCooWorkSession(activeSession.id, closingNotes);
                    setClosingNotes('');
                    setSubmitting(false);
                    toast.success('Work session completed and logged to COO Ledger.');
                    router.refresh();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  <Square size={16} /> Complete & Log Work Session
                </button>
              </div>
            ) : (
              <form
                action={async (formData) => {
                  setSubmitting(true);
                  await startCooWorkSession(formData);
                  setSubmitting(false);
                  toast.success('Active COO Work Session started.');
                  router.refresh();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Operational Pillar (Section 3.1 – 3.5)
                  </label>
                  <select
                    name="pillar"
                    required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs md:text-sm font-medium"
                  >
                    {COO_PILLARS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.shortLabel} ({p.sectionRef})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Task / Venue / Objective
                  </label>
                  <input
                    name="taskTitle"
                    required
                    placeholder="e.g., Angeethi House KDS & Menu AI Setup / Field Demo Audit"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Initial Session Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Scope of operational work for this session..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs md:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-colors"
                >
                  <Play size={16} /> Start Tracked COO Work Session
                </button>
              </form>
            )}

            {/* 5-PILLAR MANDATE REFERENCE */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                5 Operational Pillars (Section 3)
              </p>
              {COO_PILLARS.map((p) => {
                const pillarMins = verifiedSessions
                  .filter((s) => s.pillar === p.code)
                  .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
                return (
                  <div
                    key={p.code}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{p.shortLabel}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{p.description}</p>
                    </div>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
                      {(pillarMins / 60).toFixed(1)}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Verifiable Session Ledger & Founder Audit Controls */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Verifiable CRM Work-Session Log
                </h2>
                <p className="text-xs text-gray-500">
                  Every session is timestamped and auditable by the Sole Proprietor (Section 2.3 &
                  4.4).
                </p>
              </div>
              {isFounder && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full font-semibold">
                  Founder Audit Mode Active
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[11px]">
                    <th className="py-3 px-2">Date / Start</th>
                    <th className="py-3 px-2">Pillar</th>
                    <th className="py-3 px-2">Task & Deliverables</th>
                    <th className="py-3 px-2">Duration</th>
                    <th className="py-3 px-2">Status</th>
                    {isFounder && <th className="py-3 px-2 text-right">Founder Audit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sessions.map((s) => {
                    const pillarObj = COO_PILLARS.find((p) => p.code === s.pillar);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                        <td className="py-3 px-2 font-mono text-xs whitespace-nowrap">
                          {new Date(s.startedAt).toLocaleDateString('en-IN')}{' '}
                          <span className="text-gray-400">
                            {new Date(s.startedAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                            {pillarObj?.shortLabel || s.pillar}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-xs">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {s.taskTitle}
                          </p>
                          {s.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {s.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold">
                          {s.durationMinutes}m ({(s.durationMinutes / 60).toFixed(2)}h)
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'FLAGGED_BY_FOUNDER'
                                ? 'bg-red-100 text-red-800'
                                : s.status === 'AUTO_PAUSED_IDLE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        {isFounder && (
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={async () => {
                                await toggleVerifyCooSession(s.id, !s.verifiedByFounder);
                                toast.info(
                                  s.verifiedByFounder
                                    ? 'Session flagged and excluded from vesting hours.'
                                    : 'Session restored and verified.'
                                );
                                router.refresh();
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                                s.verifiedByFounder
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {s.verifiedByFounder ? 'Flag Session' : 'Restore'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                        No COO work sessions logged yet. Use the timer on the left to start tracking
                        operational hours.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENUE ONBOARDING, MODULAR STUDIO & 21-DAY FREE TRIAL BOARD */}
      {activeTab === 'onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Venue Deployment Form */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="text-indigo-500" size={20} />
              Onboard Hospitality Venue (Pillar 1 & 3)
            </h2>
            <p className="text-xs text-gray-500">
              Track restaurant, café, cloud kitchen, and hotel deployments, 21-Day Free Trial
              windows, and subscribed Golden Fork modules (Section 3.1 & 3.3).
            </p>

            <form
              action={async (formData) => {
                formData.set('subscribedModules', JSON.stringify(selectedModules));
                formData.set('annualContractValue', String(calculatedModuleAcv));
                await upsertMerchantDeployment(formData);
                toast.success('Venue deployment logged onto COO Onboarding Board.');
                router.refresh();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Venue / Merchant Name
                </label>
                <input
                  name="venueName"
                  required
                  placeholder="e.g., Angeethi House / The Papyrus Restro Cafe"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs md:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Venue Category
                  </label>
                  <select
                    name="venueType"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Café</option>
                    <option value="Cloud Kitchen">Cloud Kitchen</option>
                    <option value="Hotel">Hotel / Resort</option>
                    <option value="Lounge">Lounge / Food Court</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Deployment Stage
                  </label>
                  <select
                    name="onboardingStatus"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                  >
                    <option value="TRIAL_21_DAY">21-Day Free Trial</option>
                    <option value="MODULE_SETUP">Module Configuration</option>
                    <option value="LIVE_ACTIVE">Live Active (Paid)</option>
                    <option value="AT_RISK">At-Risk (Intervention)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Trial Start Date
                  </label>
                  <input
                    type="date"
                    name="trialStartDate"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    SLA Go-Live Target
                  </label>
                  <input
                    type="date"
                    name="slaGoLiveDate"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Subscribed Golden Fork Modules (Sec 3.1)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    ACV: ₹{calculatedModuleAcv.toLocaleString('en-IN')}/yr
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                  {GOLDEN_FORK_MODULES.map((m) => {
                    const checked = selectedModules.includes(m.code);
                    return (
                      <label
                        key={m.code}
                        className="flex items-center justify-between gap-2 text-xs p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleModuleSelection(m.code)}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {m.label}
                          </span>
                        </span>
                        <span className="font-mono text-gray-500">
                          ₹{m.annualPrice.toLocaleString('en-IN')}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Configuration & Training Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Menu AI scan status, QR table mapping, KDS stations, Police Form B/FRRO..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition-colors"
              >
                Save Venue Deployment & SLA
              </button>
            </form>
          </div>

          {/* Venue Deployments & 21-Day Trial Tracker List */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Active Venue Deployments & 21-Day Free Trial Pipeline
            </h2>
            <div className="space-y-3">
              {deployments.map((d) => {
                const modulesList: string[] = Array.isArray(d.subscribedModules)
                  ? d.subscribedModules
                  : [];
                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-gray-900 dark:text-white">
                          {d.venueName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                          {d.venueType}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(d.annualContractValue || 0).toLocaleString('en-IN')}/yr
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        21-Day Trial: <span className="font-mono">{d.trialStartDate || '-'}</span> →{' '}
                        <span className="font-mono font-semibold text-amber-600">
                          {d.trialEndsAt || '-'}
                        </span>{' '}
                        • SLA Go-Live: <span className="font-mono">{d.slaGoLiveDate || '-'}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {modulesList.map((mCode) => {
                          const mod = GOLDEN_FORK_MODULES.find((x) => x.code === mCode);
                          return (
                            <span
                              key={mCode}
                              className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium"
                            >
                              {mod?.label || mCode}
                            </span>
                          );
                        })}
                      </div>
                      {d.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic pt-1">
                          &ldquo;{d.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-between items-end gap-2 shrink-0">
                      <select
                        value={d.onboardingStatus}
                        onChange={async (e) => {
                          await updateMerchantStage(d.id, e.target.value);
                          toast.success(`Updated ${d.venueName} stage.`);
                          router.refresh();
                        }}
                        className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-bold"
                      >
                        <option value="TRIAL_21_DAY">21-Day Free Trial</option>
                        <option value="MODULE_SETUP">Module Setup</option>
                        <option value="LIVE_ACTIVE">Live Active (Paid)</option>
                        <option value="AT_RISK">At-Risk (Intervention)</option>
                        <option value="CHURNED">Churned</option>
                      </select>
                      {d.lastHealthAuditDate && (
                        <span className="text-[10px] text-gray-400">
                          Last Health Audit: {d.lastHealthAuditDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {deployments.length === 0 && (
                <div className="py-12 text-center text-gray-400 italic text-sm">
                  No venue deployments tracked yet. Add your first Golden Fork trial or paid
                  implementation on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIELD OPERATIONS GOVERNANCE & DEMO QA VERIFICATION */}
      {activeTab === 'field_qa' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={20} />
                Field Visit & Live Product Demonstration QA Auditor (Pillar 2 — Sec 3.2)
              </h2>
              <p className="text-xs text-gray-500">
                Audit Sales Executive visit logs and merchant contact records to verify that live
                demonstrations were genuinely executed.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
              {verifiedDemosCount} / {leads.length} Leads Audited by COO
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[11px]">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Merchant / Venue</th>
                  <th className="py-3 px-2">Sales Executive</th>
                  <th className="py-3 px-2">Stage</th>
                  <th className="py-3 px-2">Field Notes & Contact</th>
                  <th className="py-3 px-2 text-right">COO Demo QA Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leads.slice(0, 60).map((lead) => {
                  const exec = employees.find((e) => e.id === lead.employeeId);
                  const isVerified = (lead.customFields as any)?.cooDemoVerified === true;
                  return (
                    <tr key={lead.leadId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-2 font-mono text-xs">{lead.date}</td>
                      <td className="py-3 px-2 font-bold text-gray-900 dark:text-white">
                        {lead.name}
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                        {exec?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-xs">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {lead.notes || 'No notes logged'}
                        </p>
                        {lead.phone && (
                          <span className="text-[11px] font-mono text-gray-400">{lead.phone}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={14} /> COO Verified
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              await verifyFieldDemoByCoo(lead.leadId);
                              toast.success(`Verified field demo log for ${lead.name}`);
                              router.refresh();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                          >
                            Verify Demo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MANDATORY MONDAY 10:00 AM IST WEEKLY ACTIVITY REPORTS */}
      {activeTab === 'weekly_reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit Weekly Operations Report */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-indigo-500" size={20} />
              Submit Weekly Report (Sec 2.4)
            </h2>
            <p className="text-xs text-gray-500">
              Mandatory submission due every <strong>Monday by 10:00 AM IST</strong> for the
              preceding week. Required for Completed Month vesting qualification.
            </p>

            <form
              action={async (formData) => {
                await submitCooWeeklyReport(formData);
                toast.success('Weekly Operations & Activity Report submitted.');
                router.refresh();
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Week Start (Monday)
                  </label>
                  <input
                    type="date"
                    name="weekStartDate"
                    defaultValue={currentWeekStartStr}
                    required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                    Week End (Sunday)
                  </label>
                  <input
                    type="date"
                    name="weekEndDate"
                    defaultValue={currentWeekEndStr}
                    required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Venues Onboarded
                  </label>
                  <input
                    type="number"
                    name="venuesOnboardedCount"
                    defaultValue={liveVenuesCount}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    21-Day Trials
                  </label>
                  <input
                    type="number"
                    name="activeTrialsMonitoredCount"
                    defaultValue={activeTrialsCount}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Demos Verified
                  </label>
                  <input
                    type="number"
                    name="fieldDemosVerifiedCount"
                    defaultValue={verifiedDemosCount}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  B2B Client Project Milestones Delivered (Pillar 4)
                </label>
                <textarea
                  name="b2bMilestonesDelivered"
                  required
                  rows={2}
                  placeholder="Detail staging reviews, client assets collected, and SAC 998311 invoices triggered..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Merchant Escalations Resolved & Trial Interventions (Pillar 3)
                </label>
                <textarea
                  name="merchantEscalationsResolved"
                  required
                  rows={2}
                  placeholder="Detail KDS/POS/PMS support tickets resolved and staff training interventions..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Next-Week Operational Priorities (Pillar 5)
                </label>
                <textarea
                  name="nextWeekPriorities"
                  required
                  rows={2}
                  placeholder="Upcoming venue deployments, territory coverage, and product feedback items..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition-colors"
              >
                Submit Weekly Operations Report
              </button>
            </form>
          </div>

          {/* Submitted Weekly Reports Archive */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Weekly Operations & Activity Report Archive
            </h2>
            <div className="space-y-4">
              {weeklyReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        Week: {rep.weekStartDate} → {rep.weekEndDate}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rep.isOnTime
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rep.isOnTime ? 'Submitted On-Time' : 'Submitted Late'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {rep.totalHoursLogged}h Logged • {rep.venuesOnboardedCount} Venues •{' '}
                      {rep.fieldDemosVerifiedCount} Demos Audited
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                        B2B Milestones
                      </p>
                      <p className="text-gray-800 dark:text-gray-200">
                        {rep.b2bMilestonesDelivered}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                        Escalations Resolved
                      </p>
                      <p className="text-gray-800 dark:text-gray-200">
                        {rep.merchantEscalationsResolved}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                        Next-Week Priorities
                      </p>
                      <p className="text-gray-800 dark:text-gray-200">{rep.nextWeekPriorities}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 dark:border-gray-800 text-xs">
                    <span className="text-gray-400">
                      Submitted: {new Date(rep.submittedAt).toLocaleString('en-IN')}
                    </span>
                    {rep.founderAcknowledged ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Acknowledged by Sole Proprietor
                      </span>
                    ) : isFounder ? (
                      <button
                        onClick={async () => {
                          await acknowledgeCooWeeklyReport(rep.id);
                          toast.success('Weekly Report acknowledged.');
                          router.refresh();
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                      >
                        Acknowledge & Verify Report
                      </button>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        Pending Sole Proprietor Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {weeklyReports.length === 0 && (
                <div className="py-12 text-center text-gray-400 italic text-sm">
                  No Weekly Operations Reports submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 18-MONTH GRADED VESTING, 3% NET REVENUE LEDGER & BUYBACK CALCULATOR */}
      {activeTab === 'vesting_buyback' && (
        <div className="space-y-6">
          {/* Top Row: Graded Vesting Table + Live Buyback Option Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graded Vesting Schedule Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="text-amber-500" size={20} />
                  18-Month Graded Vesting Schedule (Section 4.2)
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                  {completedMonthsCount} Completed Months
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Completed Continuous Service</th>
                      <th className="py-2.5 px-2">Vested %</th>
                      <th className="py-2.5 px-2">Surviving Revenue Share</th>
                      <th className="py-2.5 px-2">TTM Buyout Floor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr className={completedMonthsCount < 6 ? 'bg-amber-50/60 dark:bg-amber-950/20 font-semibold' : ''}>
                      <td className="py-2.5 px-2">&lt; 6 Completed Months (Initial Cliff)</td>
                      <td className="py-2.5 px-2 font-mono">0%</td>
                      <td className="py-2.5 px-2 font-mono">0.00%</td>
                      <td className="py-2.5 px-2">60-Day Emergency Pause (Sec 4.2.4)</td>
                    </tr>
                    <tr className={completedMonthsCount >= 6 && completedMonthsCount < 12 ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold' : ''}>
                      <td className="py-2.5 px-2">6 Completed Months</td>
                      <td className="py-2.5 px-2 font-mono">25%</td>
                      <td className="py-2.5 px-2 font-mono">0.75% of Net Realized Rev</td>
                      <td className="py-2.5 px-2 font-mono">3.0x TTM Payouts</td>
                    </tr>
                    <tr className={completedMonthsCount >= 12 && completedMonthsCount < 18 ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold' : ''}>
                      <td className="py-2.5 px-2">12 Completed Months</td>
                      <td className="py-2.5 px-2 font-mono">50%</td>
                      <td className="py-2.5 px-2 font-mono">1.50% of Net Realized Rev</td>
                      <td className="py-2.5 px-2 font-mono">3.0x TTM Payouts</td>
                    </tr>
                    <tr className={completedMonthsCount >= 18 ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold' : ''}>
                      <td className="py-2.5 px-2">18 Completed Months (Full Vesting)</td>
                      <td className="py-2.5 px-2 font-mono">100%</td>
                      <td className="py-2.5 px-2 font-mono">3.00% of Net Realized Rev</td>
                      <td className="py-2.5 px-2 font-mono">4.0x TTM Payouts</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-2">
                <label className="block text-xs font-bold uppercase text-gray-500">
                  Simulate Post-Termination Survival Scenario (Sec 4.2.3 & 4.4)
                </label>
                <select
                  value={simulatedTermination}
                  onChange={(e) => setSimulatedTermination(e.target.value as CooTerminationType)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-xs font-semibold"
                >
                  <option value="NONE">Active COO Service (3.00% Active Payout)</option>
                  <option value="VOLUNTARY_RESIGNATION">
                    Voluntary Resignation by COO (Retains Achieved Milestone Tier Only)
                  </option>
                  <option value="WITHOUT_CAUSE">
                    Terminated Without Cause Post-6 Months (Pro-Rata: (Months ÷ 18) × 3.00%)
                  </option>
                  <option value="FOR_CAUSE">
                    Terminated For Cause / Fiduciary or Covenant Breach (100% Forfeited at ₹0)
                  </option>
                </select>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                  Resulting Status: {vestingState.tierLabel}
                </p>
              </div>
            </div>

            {/* Buyback Option & 24-Month Lock-In Valuation Calculator (Section 5) */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calculator className="text-indigo-500" size={20} />
                  Buyback Option & Valuation Formula (Section 5)
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
                  <Lock size={12} /> Lock-In Until 29/10/2028
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Per Section 5.2, the lump-sum Buyback Price to permanently extinguish the Vested
                Revenue-Share Percentage is the <strong>HIGHER OF</strong> (1) Vested Share ×
                Company Fair Market Valuation (FMV) or (2) {buybackValuation.ttmMultiple || 3}x
                Trailing Twelve Months (TTM) Realized Payouts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Estimated Company FMV (INR)
                  </label>
                  <input
                    type="number"
                    value={simulatedCompanyFmv}
                    onChange={(e) => setSimulatedCompanyFmv(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    TTM Realized COO Payouts (Actual)
                  </label>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 p-2.5 text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                    ₹{ttmRealizedPayouts.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    1. FMV Share ({vestingState.survivingRevenueSharePercent}%)
                  </p>
                  <p className="text-base font-mono font-bold text-gray-900 dark:text-white mt-1">
                    ₹{buybackValuation.fmvShareAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    2. TTM Floor ({buybackValuation.ttmMultiple}x)
                  </p>
                  <p className="text-base font-mono font-bold text-gray-900 dark:text-white mt-1">
                    ₹{buybackValuation.ttmFloorAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <p className="text-[10px] font-bold uppercase text-indigo-200">
                    Binding Buyback Price
                  </p>
                  <p className="text-base font-mono font-black mt-1">
                    ₹{buybackValuation.bindingBuybackPrice.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Monthly Settled Revenue Ledger (SBI A/C 36048161321) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isFounder && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <IndianRupee className="text-emerald-500" size={20} />
                  Founder: Issue Monthly Revenue Statement (Sec 4.3 & 4.5)
                </h2>
                <p className="text-xs text-gray-500">
                  Record settled customer funds in SBI A/C{' '}
                  <span className="font-mono font-semibold">36048161321</span> by the 10th of the
                  succeeding month.
                </p>

                <form
                  action={async (formData) => {
                    await upsertFounderMonthlyRevenueLedger(formData);
                    toast.success('Monthly Settled Revenue Statement updated.');
                    router.refresh();
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Calendar Month
                      </label>
                      <input
                        type="month"
                        name="month"
                        defaultValue={currentMonthStr}
                        required
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Status
                      </label>
                      <select
                        name="disbursementStatus"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-bold"
                      >
                        <option value="STATEMENT_ISSUED">Statement Issued</option>
                        <option value="PAID">Disbursed / Paid</option>
                        <option value="PENDING">Pending Verification</option>
                        <option value="FORFEITED">Forfeited (Sec 4.4)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Gross Settled Credits in SBI A/C 36048161321 (₹)
                    </label>
                    <input
                      type="number"
                      name="grossSettledInSbi"
                      required
                      placeholder="e.g., 1180000"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                        18% GST Excluded (₹)
                      </label>
                      <input
                        type="number"
                        name="gstExcluded"
                        defaultValue={0}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                        Gateway / Refunds (₹)
                      </label>
                      <input
                        type="number"
                        name="gatewayAndRefundDeductions"
                        defaultValue={0}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        name="qualifiesAsCompletedMonth"
                        value="true"
                        defaultChecked
                        className="rounded text-indigo-600"
                      />
                      Qualifies as Completed Month
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-amber-600">
                      <input
                        type="checkbox"
                        name="isEmergencyPause"
                        value="true"
                        className="rounded text-amber-600"
                      />
                      60-Day Emergency Pause
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition-colors"
                  >
                    Publish Monthly Revenue Statement
                  </button>
                </form>
              </div>
            )}

            <div
              className={`${
                isFounder ? 'lg:col-span-2' : 'lg:col-span-3'
              } bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4`}
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Monthly Settled Revenue & Completed-Month Vesting Ledger
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                      <th className="py-3 px-2">Month</th>
                      <th className="py-3 px-2">Hours / Reports</th>
                      <th className="py-3 px-2">Vesting Credit</th>
                      <th className="py-3 px-2">Net Realized Rev</th>
                      <th className="py-3 px-2">3% Gross Share</th>
                      <th className="py-3 px-2">Net Payout (Post-TDS)</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {monthlyLedgers.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 px-2 font-mono font-bold">{m.month}</td>
                        <td className="py-3 px-2 font-mono">
                          {m.hoursLogged}h • {m.weeklyReportsSubmitted}/{m.weeklyReportsRequired}{' '}
                          reports
                        </td>
                        <td className="py-3 px-2">
                          {m.isEmergencyPause ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              60-Day Emergency Pause
                            </span>
                          ) : m.qualifiesAsCompletedMonth ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              ✓ Completed Month (+1)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">
                              In Progress (&lt;60h)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono font-semibold">
                          ₹{Number(m.netRealizedRevenue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 font-mono text-indigo-600 font-bold">
                          ₹{Number(m.grossCooPayout || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 font-mono text-emerald-600 font-bold">
                          ₹{Number(m.netCooPayout || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800">
                            {m.disbursementStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {monthlyLedgers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                          No monthly revenue statements recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
