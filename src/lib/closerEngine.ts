import {
  CloserDailyReportRecord,
  CloserDisposition,
  CloserLeadAssignmentRecord,
  Lead,
} from '@/types';
import { getLeadNetAnnualRevenue, isLeadVerifiedDemo } from './compensation';
import { getIsoWeekStartKey, toIstDateKey } from './hiringMetrics';

export const CLOSER_CONSTANTS = {
  DAILY_LEAD_QUOTA: 10,
  PROBATION_DURATION_MONTHS: 2,
  PROBATION_SALARY_INR: 30000,
  POST_PROBATION_SALARY_INR: 60000,
  INCENTIVE_PERCENT: 10, // 10% of closed sales (Net Annual Revenue)
  INCENTIVE_RATE: 0.1,
  EOD_DEADLINE_HOUR_IST: 21, // 9:00 PM IST
  EOD_DEADLINE_MINUTE_IST: 0,
  EOD_DEADLINE_LABEL: '9:00 PM IST',
} as const;

export type CloserDispositionMeta = {
  code: CloserDisposition;
  label: string;
  shortLabel: string;
  countsAsWorked: boolean;
  countsAsConnected: boolean;
  isCarryOver: boolean;
  mapsToLeadStatus?: string;
  badgeClass: string;
};

export const CLOSER_DISPOSITIONS: CloserDispositionMeta[] = [
  {
    code: 'UNWORKED',
    label: 'Unworked (Not Touched Yet)',
    shortLabel: 'Unworked',
    countsAsWorked: false,
    countsAsConnected: false,
    isCarryOver: false,
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  {
    code: 'CALL_ATTEMPTED',
    label: 'Call Attempted (No Pickup)',
    shortLabel: 'Call Attempted',
    countsAsWorked: true,
    countsAsConnected: false,
    isCarryOver: false,
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  {
    code: 'CONNECTED',
    label: 'Connected / Discovery Done',
    shortLabel: 'Connected',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: false,
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
  },
  {
    code: 'DEMO_SCHEDULED',
    label: 'Closing Call / Demo Scheduled',
    shortLabel: 'Demo Scheduled',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: true,
    badgeClass:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
  },
  {
    code: 'FOLLOW_UP',
    label: 'Follow-Up (Carry-Over Pipeline)',
    shortLabel: 'Follow-Up',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: true,
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  },
  {
    code: 'PROPOSAL_SENT',
    label: 'Proposal Sent (Carry-Over Pipeline)',
    shortLabel: 'Proposal Sent',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: true,
    mapsToLeadStatus: 'Proposal Sent',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    code: 'PENDING_VERIFICATION',
    label: 'Closed — Pending Payment Verification',
    shortLabel: 'Pending Verif.',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: true,
    mapsToLeadStatus: 'Pending Verification',
    badgeClass:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
  },
  {
    code: 'CLOSED_WON',
    label: 'Closed Won (Verified)',
    shortLabel: 'Closed Won',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: false,
    mapsToLeadStatus: 'Converted',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    code: 'CLOSED_LOST',
    label: 'Closed Lost / Disqualified',
    shortLabel: 'Closed Lost',
    countsAsWorked: true,
    countsAsConnected: true,
    isCarryOver: false,
    mapsToLeadStatus: 'Lost',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  },
  {
    code: 'UNRESPONSIVE',
    label: 'Unresponsive (Eligible for Recycle)',
    shortLabel: 'Unresponsive',
    countsAsWorked: true,
    countsAsConnected: false,
    isCarryOver: false,
    badgeClass:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  },
  {
    code: 'RECYCLED',
    label: 'Recycled to Pool by COO',
    shortLabel: 'Recycled',
    countsAsWorked: true,
    countsAsConnected: false,
    isCarryOver: false,
    badgeClass:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
];

export const CLOSER_SELECTABLE_DISPOSITIONS = CLOSER_DISPOSITIONS.filter(
  (d) => d.code !== 'RECYCLED' && d.code !== 'CLOSED_WON'
);

export const CARRY_OVER_DISPOSITIONS = new Set<string>([
  'FOLLOW_UP',
  'PROPOSAL_SENT',
  'DEMO_SCHEDULED',
  'PENDING_VERIFICATION',
]);

export function getDispositionMeta(code: string): CloserDispositionMeta {
  return (
    CLOSER_DISPOSITIONS.find((d) => d.code === code) || CLOSER_DISPOSITIONS[0]
  );
}

/**
 * Computes Closer monthly compensation:
 * - Months 1 & 2 (2-month probation): ₹30,000 fixed base/month
 * - Month 3+ (post-probation): ₹60,000 fixed base/month
 * - Incentive: 10% of closed sales (settled Net Annual Revenue)
 */
export function calculateCloserMonthlyCompensation(params: {
  empBaseSalary?: number;
  empProbationSalary?: number;
  probationDuration?: number;
  incentivePercent?: number;
  monthsSinceJoin: number;
  netRevenueClosedThisMonth: number;
  conversionsThisMonth: number;
}) {
  const probationDuration = Math.max(
    1,
    params.probationDuration ?? CLOSER_CONSTANTS.PROBATION_DURATION_MONTHS
  );
  const probationBase =
    params.empProbationSalary && params.empProbationSalary > 0
      ? params.empProbationSalary
      : CLOSER_CONSTANTS.PROBATION_SALARY_INR;
  const postProbationBase =
    params.empBaseSalary && params.empBaseSalary > 0
      ? params.empBaseSalary
      : CLOSER_CONSTANTS.POST_PROBATION_SALARY_INR;

  // Normalize commissionRate: Closer stores percentage (e.g. 10 for 10%). Guard against invalid values.
  const rawPct =
    params.incentivePercent !== undefined && params.incentivePercent > 0 && params.incentivePercent <= 100
      ? params.incentivePercent
      : CLOSER_CONSTANTS.INCENTIVE_PERCENT;
  const incentiveRate = rawPct / 100;

  const isProbationPeriod = params.monthsSinceJoin < probationDuration;
  const basePayout = isProbationPeriod ? probationBase : postProbationBase;
  const netRev = Math.max(0, params.netRevenueClosedThisMonth || 0);
  const incentivePayout = Math.round(netRev * incentiveRate);
  const grossPayout = basePayout + incentivePayout;
  const tdsDeduction = 0;
  const totalPayout = grossPayout;

  const currentMonthNumber = Math.max(1, params.monthsSinceJoin + 1);
  const tierStatusLabel = isProbationPeriod
    ? `Probation (Month ${currentMonthNumber} of ${probationDuration}) — ₹${basePayout.toLocaleString(
        'en-IN'
      )} Base + ${rawPct}% Closed Sales Incentive`
    : `Post-Probation — ₹${basePayout.toLocaleString(
        'en-IN'
      )} Base + ${rawPct}% Closed Sales Incentive`;

  return {
    basePayout,
    incentivePayout,
    incentivePercent: rawPct,
    grossPayout,
    tdsDeduction,
    totalPayout,
    isProbationPeriod,
    probationDuration,
    tierStatusLabel,
    willTerminate: false,
  };
}

/**
 * Returns the exact UTC Date corresponding to 9:00 PM IST (21:00:00+05:30)
 * on the specified IST calendar date (`YYYY-MM-DD`).
 */
export function getCloserEodDeadlineUtc(istDateKey: string): Date {
  const [year, month, day] = istDateKey.split('-').map(Number);
  // 21:00 IST == 15:30 UTC of the same calendar day
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 15, 30, 0, 0));
}

export function evaluateCloserEodSubmission(
  reportDateIST: string,
  submittedAt: Date = new Date()
): { deadlineAt: Date; isOnTime: boolean } {
  const deadlineAt = getCloserEodDeadlineUtc(reportDateIST);
  return {
    deadlineAt,
    isOnTime: submittedAt.getTime() <= deadlineAt.getTime(),
  };
}

export type CloserBatchMetrics = {
  assignedCount: number;
  workedCount: number;
  unworkedCount: number;
  connectedCount: number;
  demosCount: number;
  proposalsSentCount: number;
  sentForVerificationCount: number;
  closedWonCount: number;
  lostCount: number;
  carryOverCount: number;
  netRevenueClosed: number;
  avgTimeToFirstTouchMins: number | null;
};

export function computeCloserBatchMetrics(
  assignments: CloserLeadAssignmentRecord[],
  leadsMap: Map<string, Lead>
): CloserBatchMetrics {
  const activeAssignments = assignments.filter((a) => !a.isRecycled);
  let workedCount = 0;
  let unworkedCount = 0;
  let connectedCount = 0;
  let demosCount = 0;
  let proposalsSentCount = 0;
  let sentForVerificationCount = 0;
  let closedWonCount = 0;
  let lostCount = 0;
  let carryOverCount = 0;
  let netRevenueClosed = 0;
  const touchDelaysMins: number[] = [];

  for (const a of activeAssignments) {
    const lead = leadsMap.get(a.leadId);
    // Derive effective disposition if Manager/COO already converted or marked lost on the Lead
    let disp = a.disposition;
    if (lead?.status === 'Converted') disp = 'CLOSED_WON';
    else if (lead?.status === 'Pending Verification' && disp !== 'CLOSED_WON') {
      disp = 'PENDING_VERIFICATION';
    } else if (lead?.status === 'Lost') {
      disp = 'CLOSED_LOST';
    }

    const meta = getDispositionMeta(disp);
    if (meta.countsAsWorked) workedCount += 1;
    else unworkedCount += 1;

    if (meta.countsAsConnected) connectedCount += 1;
    if (disp === 'DEMO_SCHEDULED') demosCount += 1;
    if (disp === 'PROPOSAL_SENT') proposalsSentCount += 1;
    if (disp === 'PENDING_VERIFICATION') sentForVerificationCount += 1;
    if (disp === 'CLOSED_WON') {
      closedWonCount += 1;
      if (lead) netRevenueClosed += getLeadNetAnnualRevenue(lead);
    }
    if (disp === 'CLOSED_LOST') lostCount += 1;
    if (CARRY_OVER_DISPOSITIONS.has(disp)) carryOverCount += 1;

    if (a.firstTouchedAt && a.assignedAt) {
      const diffMs =
        new Date(a.firstTouchedAt).getTime() - new Date(a.assignedAt).getTime();
      if (diffMs >= 0) {
        touchDelaysMins.push(Math.round(diffMs / 60000));
      }
    }
  }

  const avgTimeToFirstTouchMins =
    touchDelaysMins.length > 0
      ? Math.round(
          touchDelaysMins.reduce((acc, m) => acc + m, 0) / touchDelaysMins.length
        )
      : null;

  return {
    assignedCount: activeAssignments.length,
    workedCount,
    unworkedCount,
    connectedCount,
    demosCount,
    proposalsSentCount,
    sentForVerificationCount,
    closedWonCount,
    lostCount,
    carryOverCount,
    netRevenueClosed,
    avgTimeToFirstTouchMins,
  };
}

/**
 * Separates a Closer's assignments into:
 * 1. Today's fresh 10-lead batch (`batchDate === todayIST`, non-recycled)
 * 2. Active Carry-Over Pipeline (prior-day assignments marked Follow-Up, Proposal Sent,
 *    Demo Scheduled, or Pending Verification whose lead is not yet Converted/Lost).
 * Carry-over leads stay in Tab 2 and NEVER reduce tomorrow's fresh 10-lead daily quota.
 */
export function partitionCloserQueue(
  assignments: CloserLeadAssignmentRecord[],
  leadsMap: Map<string, Lead>,
  todayIST: string
): {
  todayBatch: CloserLeadAssignmentRecord[];
  carryOverQueue: CloserLeadAssignmentRecord[];
  closedHistory: CloserLeadAssignmentRecord[];
} {
  const todayBatch: CloserLeadAssignmentRecord[] = [];
  const todayLeadIds = new Set<string>();

  for (const a of assignments) {
    if (!a.isRecycled && a.batchDate === todayIST) {
      todayBatch.push(a);
      todayLeadIds.add(a.leadId);
    }
  }
  todayBatch.sort((a, b) => a.slotNumber - b.slotNumber);

  // Deduplicate carry-over by leadId (keeping latest assignment per lead)
  const carryOverByLead = new Map<string, CloserLeadAssignmentRecord>();
  const closedHistory: CloserLeadAssignmentRecord[] = [];

  const sortedOlder = assignments
    .filter((a) => !a.isRecycled && a.batchDate < todayIST)
    .sort((a, b) => b.batchDate.localeCompare(a.batchDate));

  for (const a of sortedOlder) {
    const lead = leadsMap.get(a.leadId);
    const isLeadClosed = lead?.status === 'Converted' || lead?.status === 'Lost';

    if (lead?.status === 'Converted' || a.disposition === 'CLOSED_WON') {
      closedHistory.push(a);
      continue;
    }

    if (isLeadClosed || todayLeadIds.has(a.leadId)) {
      continue;
    }

    const effectiveDisp =
      lead?.status === 'Pending Verification'
        ? 'PENDING_VERIFICATION'
        : lead?.status === 'Proposal Sent' && a.disposition === 'UNWORKED'
        ? 'PROPOSAL_SENT'
        : a.disposition;

    if (
      CARRY_OVER_DISPOSITIONS.has(effectiveDisp) &&
      !carryOverByLead.has(a.leadId)
    ) {
      carryOverByLead.set(a.leadId, a);
    }
  }

  return {
    todayBatch,
    carryOverQueue: Array.from(carryOverByLead.values()),
    closedHistory,
  };
}

export type CloserPerformanceScorecard = {
  closerId: string;
  todayAssigned: number;
  todayWorked: number;
  todayUnworked: number;
  carryOverActiveCount: number;
  weekAssigned: number;
  weekWorked: number;
  weekClosedWon: number;
  monthAssigned: number;
  monthWorked: number;
  monthConnected: number;
  monthProposals: number;
  monthClosedWon: number;
  monthNetRevenue: number;
  monthIncentiveInr: number;
  touchCompletionRatePct: number;
  connectRatePct: number;
  closeRatePct: number;
  avgTimeToFirstTouchMins: number | null;
  eodSubmittedToday: boolean;
  eodTodayUnworked: number;
  eodOnTimeCount: number;
  eodTotalReports: number;
};

export function computeCloserPerformanceScorecard(
  closerId: string,
  allAssignments: CloserLeadAssignmentRecord[],
  allReports: CloserDailyReportRecord[],
  leads: Lead[],
  now: Date = new Date(),
  incentivePercent: number = CLOSER_CONSTANTS.INCENTIVE_PERCENT
): CloserPerformanceScorecard {
  const todayIST = toIstDateKey(now);
  const weekStartIST = getIsoWeekStartKey(todayIST);
  const monthPrefix = todayIST.slice(0, 7);

  const leadsMap = new Map<string, Lead>(leads.map((l) => [l.leadId, l]));
  const mine = allAssignments.filter((a) => a.closerId === closerId && !a.isRecycled);
  const myReports = allReports.filter((r) => r.closerId === closerId);

  const { todayBatch, carryOverQueue } = partitionCloserQueue(mine, leadsMap, todayIST);
  const todayMetrics = computeCloserBatchMetrics(todayBatch, leadsMap);

  const weekAssignments = mine.filter(
    (a) => a.batchDate >= weekStartIST && a.batchDate <= todayIST
  );
  const weekMetrics = computeCloserBatchMetrics(weekAssignments, leadsMap);

  const monthAssignments = mine.filter((a) => a.batchDate.startsWith(monthPrefix));
  const monthMetrics = computeCloserBatchMetrics(monthAssignments, leadsMap);

  // Authoritative month closed deals & revenue directly from Converted leads where closerId === closerId
  const monthConvertedLeads = leads.filter((l) => {
    if (l.closerId !== closerId || l.status !== 'Converted') return false;
    const convDate = toIstDateKey(l.convertedAt ? new Date(l.convertedAt) : l.date);
    return convDate.startsWith(monthPrefix);
  });
  const weekConvertedLeads = leads.filter((l) => {
    if (l.closerId !== closerId || l.status !== 'Converted') return false;
    const convDate = toIstDateKey(l.convertedAt ? new Date(l.convertedAt) : l.date);
    return convDate >= weekStartIST && convDate <= todayIST;
  });

  const monthClosedWon = Math.max(monthMetrics.closedWonCount, monthConvertedLeads.length);
  const monthNetRevenue = Math.max(
    monthMetrics.netRevenueClosed,
    monthConvertedLeads.reduce((sum, l) => sum + getLeadNetAnnualRevenue(l), 0)
  );
  const weekClosedWon = Math.max(weekMetrics.closedWonCount, weekConvertedLeads.length);

  const touchCompletionRatePct =
    monthMetrics.assignedCount > 0
      ? Math.round((monthMetrics.workedCount / monthMetrics.assignedCount) * 100)
      : 0;
  const connectRatePct =
    monthMetrics.workedCount > 0
      ? Math.round((monthMetrics.connectedCount / monthMetrics.workedCount) * 100)
      : 0;
  const closeRatePct =
    monthMetrics.assignedCount > 0
      ? Math.round((monthClosedWon / monthMetrics.assignedCount) * 1000) / 10
      : 0;

  const todayReport = myReports.find((r) => r.reportDate === todayIST);
  const monthReports = myReports.filter((r) => r.reportDate.startsWith(monthPrefix));

  return {
    closerId,
    todayAssigned: todayMetrics.assignedCount,
    todayWorked: todayMetrics.workedCount,
    todayUnworked: todayMetrics.unworkedCount,
    carryOverActiveCount: carryOverQueue.length,
    weekAssigned: weekMetrics.assignedCount,
    weekWorked: weekMetrics.workedCount,
    weekClosedWon,
    monthAssigned: monthMetrics.assignedCount,
    monthWorked: monthMetrics.workedCount,
    monthConnected: monthMetrics.connectedCount,
    monthProposals: monthMetrics.proposalsSentCount,
    monthClosedWon,
    monthNetRevenue,
    monthIncentiveInr: Math.round(monthNetRevenue * (incentivePercent / 100)),
    touchCompletionRatePct,
    connectRatePct,
    closeRatePct,
    avgTimeToFirstTouchMins: monthMetrics.avgTimeToFirstTouchMins,
    eodSubmittedToday: Boolean(todayReport),
    eodTodayUnworked: todayReport ? todayReport.unworkedCount : todayMetrics.unworkedCount,
    eodOnTimeCount: monthReports.filter((r) => r.isOnTime).length,
    eodTotalReports: monthReports.length,
  };
}

/**
 * Smart-Fill priority scorer for COO's 1-click "Fill Remaining to 10" action.
 * Prioritizes: Proposal Sent > COO Verified Demo > Has Phone > Higher Modular Value > Recency.
 */
export function selectSmartFillLeads(eligibleLeads: Lead[], count: number): Lead[] {
  if (count <= 0) return [];
  const scored = eligibleLeads.map((lead) => {
    let score = 0;
    if (lead.status === 'Proposal Sent') score += 50;
    else if (lead.status === 'Lead Captured') score += 20;

    if ((lead.customFields as any)?.cooDemoVerified) score += 25;
    if (isLeadVerifiedDemo(lead)) score += 15;
    if (lead.phone && lead.phone.trim().length >= 7) score += 20;
    if ((lead.customFields as any)?.netAnnualRevenue > 0) score += 10;
    if (lead.notes && lead.notes.trim().length > 20) score += 5;

    return { lead, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.lead.createdAt).getTime() - new Date(a.lead.createdAt).getTime();
  });

  return scored.slice(0, count).map((s) => s.lead);
}
