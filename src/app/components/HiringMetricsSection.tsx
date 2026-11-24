'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarRange,
  Trophy,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  HiringRecord,
  HiringScope,
  HR_HIRING_TARGETS,
  computeHiringAnalytics,
} from '@/lib/hiringMetrics';

type PeriodTab = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Props = {
  hiringRecords: HiringRecord[];
  isHR?: boolean;
  compact?: boolean;
  referenceNowIso?: string;
};

export default function HiringMetricsSection({
  hiringRecords,
  isHR = false,
  compact = false,
  referenceNowIso,
}: Props) {
  const [scope, setScope] = useState<HiringScope>('hr');
  const [activeTab, setActiveTab] = useState<PeriodTab>('monthly');

  const referenceNow = useMemo(
    () => (referenceNowIso ? new Date(referenceNowIso) : new Date()),
    [referenceNowIso]
  );

  const analytics = useMemo(
    () =>
      computeHiringAnalytics(
        hiringRecords,
        scope,
        referenceNow,
        HR_HIRING_TARGETS.MONTHLY_AIM
      ),
    [hiringRecords, scope, referenceNow]
  );

  const scopedRecentHires = useMemo(() => {
    const list =
      scope === 'hr' ? hiringRecords.filter((r) => r.isHrHire) : hiringRecords;
    return list.slice(0, 12);
  }, [hiringRecords, scope]);

  const statusBadge = (() => {
    switch (analytics.monthly.status) {
      case 'ACHIEVED':
        return {
          label: 'Monthly Aim Achieved',
          cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          icon: CheckCircle2,
        };
      case 'ON_TRACK':
        return {
          label: 'On Track for 30/mo',
          cls: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
          icon: TrendingUp,
        };
      case 'SLIGHTLY_BEHIND':
        return {
          label: 'Behind Pace',
          cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          icon: Clock,
        };
      case 'AT_RISK':
      default:
        return {
          label: 'Needs Acceleration',
          cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
          icon: AlertTriangle,
        };
    }
  })();

  const StatusIcon = statusBadge.icon;

  // Compact banner mode for /team page
  if (compact) {
    return (
      <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-500/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight">
                  HR Hiring Tracker
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Aim: {HR_HIRING_TARGETS.MONTHLY_AIM} / Month
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {analytics.monthly.monthLabel}:{' '}
                <strong className="text-white">
                  {analytics.monthly.count} / {analytics.monthly.target}
                </strong>{' '}
                hires ({analytics.monthly.percent}%) •{' '}
                {analytics.monthly.remaining > 0
                  ? `${analytics.monthly.remaining} remaining`
                  : 'Target achieved!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setScope('hr')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                scope === 'hr'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              HR Hirings
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                scope === 'all'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Org
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Daily ({analytics.daily.dateLabel})
            </div>
            <div className="text-xl font-black tabular-nums mt-0.5">
              {analytics.daily.count}
              <span className="text-xs font-medium text-slate-400 ml-1">
                / {analytics.daily.target} pace
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Weekly ({analytics.weekly.weekRangeLabel})
            </div>
            <div className="text-xl font-black tabular-nums mt-0.5">
              {analytics.weekly.count}
              <span className="text-xs font-medium text-slate-400 ml-1">
                / {analytics.weekly.target} pace
              </span>
            </div>
          </div>
          <div className="bg-indigo-500/20 border border-indigo-400/40 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">
              Monthly ({analytics.monthly.monthLabel})
            </div>
            <div className="text-xl font-black tabular-nums mt-0.5 text-amber-300">
              {analytics.monthly.count}
              <span className="text-xs font-semibold text-indigo-200 ml-1">
                / {analytics.monthly.target} aim
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Yearly ({analytics.yearly.year})
            </div>
            <div className="text-xl font-black tabular-nums mt-0.5">
              {analytics.yearly.count}
              <span className="text-xs font-medium text-slate-400 ml-1">
                / {analytics.yearly.target} yr
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeSeries = analytics.series[activeTab];
  const activeTarget =
    activeTab === 'daily'
      ? analytics.daily.target
      : activeTab === 'weekly'
      ? analytics.weekly.target
      : activeTab === 'monthly'
      ? analytics.monthly.target
      : analytics.yearly.target;

  const activeTargetLabel =
    activeTab === 'daily'
      ? `Daily Pace (${activeTarget})`
      : activeTab === 'weekly'
      ? `Weekly Pace (${activeTarget})`
      : activeTab === 'monthly'
      ? `HR Monthly Aim (${activeTarget})`
      : `Yearly Aim (${activeTarget})`;

  const maxChartValue = Math.max(
    activeTarget,
    ...activeSeries.map((p) => p.count),
    1
  );

  return (
    <section className="spatial-card rounded-3xl p-5 md:p-7 shadow-sm border border-indigo-100/80 dark:border-indigo-900/50 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <UserPlus size={18} />
            </span>
            <h3 className="text-xl md:text-2xl font-serif font-black tracking-tight text-gray-900 dark:text-white">
              {isHR ? 'My Hiring Performance & Monthly Aim' : 'HR Hiring Performance & Monthly Aim'}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.cls}`}
            >
              <StatusIcon size={13} />
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Tracking daily, weekly, monthly, and yearly hirings against the{' '}
            <strong className="text-indigo-700 dark:text-indigo-300">
              {HR_HIRING_TARGETS.MONTHLY_AIM} hirings / month
            </strong>{' '}
            HR aim ({analytics.monthly.monthLabel}, IST).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setScope('hr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'hr'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              HR Hirings ({analytics.totals.hrMonthlyCount} mo)
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Org ({analytics.totals.allOrgMonthlyCount} mo)
            </button>
          </div>

          <Link
            href="/team"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            + Onboard Hire <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Monthly Aim Progress Bar Card (30 / Month Goal) */}
      <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/80 dark:from-indigo-950/40 dark:via-gray-900 dark:to-violet-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {analytics.monthly.monthLabel} Monthly Hiring Aim
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              Goal: {analytics.monthly.target} hires
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
              {analytics.monthly.count}
            </span>
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
              / {analytics.monthly.target} ({analytics.monthly.percent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar with Expected Pace Marker */}
        <div className="relative h-3.5 w-full rounded-full bg-gray-200/90 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analytics.monthly.count >= analytics.monthly.target
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : analytics.monthly.percent >= 65
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                : 'bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(100, analytics.monthly.percent)}%` }}
          />
          {/* Expected linear pace marker for day of month */}
          <div
            title={`Expected pace by Day ${analytics.monthly.daysElapsed}: ${analytics.monthly.expectedByToday} hires`}
            className="absolute top-0 bottom-0 w-0.5 bg-gray-900/60 dark:bg-white/70"
            style={{
              left: `${Math.min(
                100,
                Math.round((analytics.monthly.daysElapsed / analytics.monthly.daysInMonth) * 100)
              )}%`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Day <strong>{analytics.monthly.daysElapsed}</strong> of{' '}
              <strong>{analytics.monthly.daysInMonth}</strong> (
              {analytics.monthly.daysRemaining}d left)
            </span>
            <span>
              Expected Pace by Today:{' '}
              <strong>{analytics.monthly.expectedByToday}</strong> hires
            </span>
            {analytics.monthly.remaining > 0 ? (
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
                {analytics.monthly.remaining} more needed
                {analytics.monthly.daysRemaining > 0
                  ? ` (~${analytics.monthly.requiredDailyRate}/day)`
                  : ' today'}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                🎉 Monthly aim of {analytics.monthly.target} reached!
              </span>
            )}
          </div>
          {scope === 'hr' && analytics.totals.nonHrMonthlyCount > 0 && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              +{analytics.totals.nonHrMonthlyCount} added by Management ({analytics.totals.allOrgMonthlyCount} total org)
            </span>
          )}
        </div>
      </div>

      {/* 4 Period KPI Cards: Daily | Weekly | Monthly | Yearly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Daily */}
        <div
          onClick={() => setActiveTab('daily')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'daily'
              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Daily Hirings
            </span>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Calendar size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {analytics.daily.count}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              / {analytics.daily.target} daily pace
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${analytics.daily.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
            <span>Today ({analytics.daily.dateLabel})</span>
            <span>Yesterday: {analytics.daily.yesterdayCount}</span>
          </p>
        </div>

        {/* Weekly */}
        <div
          onClick={() => setActiveTab('weekly')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'weekly'
              ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 ring-2 ring-violet-500/20'
              : 'bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Weekly Hirings
            </span>
            <span className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
              <CalendarDays size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {analytics.weekly.count}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              / {analytics.weekly.target} weekly pace
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full"
              style={{ width: `${analytics.weekly.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
            <span>{analytics.weekly.weekRangeLabel}</span>
            <span>{analytics.weekly.percent}%</span>
          </p>
        </div>

        {/* Monthly (Primary Aim = 30) */}
        <div
          onClick={() => setActiveTab('monthly')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'monthly'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/25'
              : 'bg-white/70 dark:bg-gray-900/60 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Monthly Hirings
            </span>
            <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              <CalendarRange size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
              {analytics.monthly.count}
            </span>
            <span className="text-xs font-bold text-indigo-600/80 dark:text-indigo-300/80">
              / {analytics.monthly.target} HR Aim
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${analytics.monthly.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-2 flex justify-between font-medium">
            <span>{analytics.monthly.monthLabel}</span>
            <span>
              {analytics.monthly.remaining > 0
                ? `${analytics.monthly.remaining} left`
                : 'Achieved'}
            </span>
          </p>
        </div>

        {/* Yearly */}
        <div
          onClick={() => setActiveTab('yearly')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'yearly'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Yearly Hirings
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Trophy size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {analytics.yearly.count}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              / {analytics.yearly.target} annual
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${analytics.yearly.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
            <span>Year {analytics.yearly.year}</span>
            <span>{analytics.yearly.activeFromYearCount} active now</span>
          </p>
        </div>
      </div>

      {/* Bottom 2-Column Section: Trend Chart + Recruiter Breakdown & Recent Hires */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Velocity Chart */}
        <div className="lg:col-span-7 rounded-2xl p-4 md:p-5 bg-white/60 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Hiring Breakdown Trend
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {activeTab === 'daily' && 'Last 14 days (IST) vs daily pace'}
                {activeTab === 'weekly' && 'Last 8 weeks (Mon–Sun IST) vs weekly pace'}
                {activeTab === 'monthly' &&
                  `Jan–Dec ${analytics.yearly.year} vs ${HR_HIRING_TARGETS.MONTHLY_AIM}/month HR aim`}
                {activeTab === 'yearly' &&
                  `Annual hiring volume vs ${analytics.yearly.target}/year annualized aim`}
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
              {(
                [
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeSeries}
                margin={{ top: 14, right: 12, bottom: 4, left: -18 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, Math.ceil(maxChartValue * 1.15)]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 8px 20px -4px rgb(0 0 0 / 0.2)',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, _name: any, item: any) => {
                    const p = item?.payload;
                    const pct =
                      p?.target > 0 ? Math.round((Number(value) / p.target) * 100) : 0;
                    const extra =
                      scope === 'all' && p
                        ? ` (HR: ${p.hrCount}, Mgmt: ${p.otherCount})`
                        : '';
                    return [`${value} hires (${pct}% of ${p?.target})${extra}`, 'Hirings'];
                  }}
                />
                <ReferenceLine
                  y={activeTarget}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: activeTargetLabel,
                    position: 'insideTopRight',
                    fill: '#d97706',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={38}>
                  {activeSeries.map((entry) => {
                    const met = entry.count >= entry.target;
                    const isCurrent =
                      (activeTab === 'daily' && entry.key === analytics.referenceDateIST) ||
                      (activeTab === 'weekly' && entry.key === analytics.weekly.weekStartIST) ||
                      (activeTab === 'monthly' && entry.key === analytics.monthly.monthKey) ||
                      (activeTab === 'yearly' && entry.key === String(analytics.yearly.year));

                    const fill = met
                      ? '#10b981'
                      : isCurrent
                      ? '#4f46e5'
                      : '#818cf8';
                    return <Cell key={entry.key} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruiter Breakdown & Recent Hires */}
        <div className="lg:col-span-5 rounded-2xl p-4 md:p-5 bg-white/60 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 flex flex-col gap-4">
          {/* Recruiter Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Users size={15} className="text-indigo-500" />
                Hirings by Recruiter
              </h4>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                D / W / M / Y
              </span>
            </div>
            {analytics.recruiters.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No hiring logs recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.recruiters.map((rec) => (
                  <div
                    key={rec.recruiterId}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {rec.recruiterName}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          rec.isHr
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {rec.recruiterRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 tabular-nums font-semibold">
                      <span
                        title="Today"
                        className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                      >
                        {rec.daily}d
                      </span>
                      <span
                        title="This Week"
                        className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                      >
                        {rec.weekly}w
                      </span>
                      <span
                        title="This Month"
                        className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold"
                      >
                        {rec.monthly}m
                      </span>
                      <span
                        title="This Year"
                        className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      >
                        {rec.yearly}y
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Hires List */}
          <div className="pt-3 border-t border-gray-200/70 dark:border-gray-800 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Recent {scope === 'hr' ? 'HR' : 'Organization'} Hires
              </h4>
              <span className="text-[11px] text-gray-400">
                Showing {scopedRecentHires.length} latest
              </span>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {scopedRecentHires.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">
                  No hires recorded for this filter yet.
                </p>
              ) : (
                scopedRecentHires.map((hire) => (
                  <div
                    key={hire.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {hire.hiredEmployeeName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            hire.isCurrentlyActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {hire.isCurrentlyActive ? 'Active' : 'Offboarded'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {hire.hiredEmployeeRole} • by {hire.hiredByName}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {hire.hiredDateIST}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
