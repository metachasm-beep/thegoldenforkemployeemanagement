export const HR_HIRING_TARGETS = {
  MONTHLY_AIM: 30,
  WEEKLY_PACE: 7,
  DAILY_PACE: 1,
  YEARLY_AIM: 360, // 30 hires/month × 12 months
} as const;

export type HiringRecord = {
  id: string;
  hiredEmployeeId: string;
  hiredEmployeeName: string;
  hiredEmployeeRole: string;
  hiredAt: string; // ISO UTC timestamp
  hiredDateIST: string; // YYYY-MM-DD in Asia/Kolkata (IST)
  hiredById: string;
  hiredByName: string;
  hiredByRole: string;
  isHrHire: boolean;
  isCurrentlyActive: boolean;
};

export type HiringScope = 'hr' | 'all';

export type HiringPaceStatus = 'ACHIEVED' | 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'AT_RISK';

export type HiringSeriesPoint = {
  key: string;
  label: string;
  count: number;
  hrCount: number;
  otherCount: number;
  target: number;
};

export type RecruiterHiringSummary = {
  recruiterId: string;
  recruiterName: string;
  recruiterRole: string;
  isHr: boolean;
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  total: number;
};

export type HiringAnalytics = {
  referenceDateIST: string;
  daily: {
    count: number;
    yesterdayCount: number;
    target: number;
    remaining: number;
    percent: number;
    dateLabel: string;
  };
  weekly: {
    count: number;
    target: number;
    remaining: number;
    percent: number;
    weekRangeLabel: string;
    weekStartIST: string;
    weekEndIST: string;
  };
  monthly: {
    count: number;
    target: number;
    remaining: number;
    percent: number;
    monthLabel: string;
    monthKey: string;
    daysElapsed: number;
    daysInMonth: number;
    daysRemaining: number;
    expectedByToday: number;
    requiredDailyRate: number;
    status: HiringPaceStatus;
  };
  yearly: {
    count: number;
    activeFromYearCount: number;
    target: number;
    remaining: number;
    percent: number;
    year: number;
  };
  totals: {
    allTimeCount: number;
    hrMonthlyCount: number;
    allOrgMonthlyCount: number;
    nonHrMonthlyCount: number;
  };
  series: {
    daily: HiringSeriesPoint[]; // Last 14 days (IST)
    weekly: HiringSeriesPoint[]; // Last 8 ISO weeks (Mon-Sun IST)
    monthly: HiringSeriesPoint[]; // All 12 months of current IST year
    yearly: HiringSeriesPoint[]; // All years present in data
  };
  recruiters: RecruiterHiringSummary[];
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Converts a Date or ISO string to an IST-shifted UTC Date object.
 * Always use `.getUTC*()` methods on the returned value for deterministic IST calendar math.
 */
function toIstShiftedDate(input: Date | string): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Date(d.getTime() + IST_OFFSET_MS);
}

export function formatUtcDateKey(shifted: Date): string {
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toIstDateKey(input: Date | string): string {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  return formatUtcDateKey(toIstShiftedDate(input));
}

function parseDateKeyToUtcMidnight(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const d = parseDateKeyToUtcMidnight(dateKey);
  return formatUtcDateKey(new Date(d.getTime() + days * DAY_MS));
}

function formatShortDayLabel(dateKey: string): string {
  const d = parseDateKeyToUtcMidnight(dateKey);
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

/**
 * Returns the Monday (YYYY-MM-DD) of the ISO week containing `dateKey`.
 */
export function getIsoWeekStartKey(dateKey: string): string {
  const d = parseDateKeyToUtcMidnight(dateKey);
  const dayOfWeek = d.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return formatUtcDateKey(new Date(d.getTime() - daysSinceMonday * DAY_MS));
}

function clampPercent(count: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((count / target) * 1000) / 10);
}

/**
 * Computes daily, weekly, monthly, and yearly hiring analytics relative to `now` in IST.
 * HR monthly hiring aim defaults to 30 hires/month.
 */
export function computeHiringAnalytics(
  allRecords: HiringRecord[],
  scope: HiringScope = 'hr',
  now: Date = new Date(),
  monthlyAim: number = HR_HIRING_TARGETS.MONTHLY_AIM
): HiringAnalytics {
  const shiftedNow = toIstShiftedDate(now);
  const todayKey = formatUtcDateKey(shiftedNow);
  const yesterdayKey = addDaysToDateKey(todayKey, -1);

  const currentYear = shiftedNow.getUTCFullYear();
  const currentMonthIdx = shiftedNow.getUTCMonth(); // 0-11
  const currentMonthKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const daysElapsed = shiftedNow.getUTCDate();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonthIdx + 1, 0)).getUTCDate();
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const weekStartKey = getIsoWeekStartKey(todayKey);
  const weekEndKey = addDaysToDateKey(weekStartKey, 6);

  const scopedRecords =
    scope === 'hr' ? allRecords.filter((r) => r.isHrHire) : allRecords;

  // Period counts for active scope
  let dailyCount = 0;
  let yesterdayCount = 0;
  let weeklyCount = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;
  let activeFromYearCount = 0;

  for (const r of scopedRecords) {
    const dk = r.hiredDateIST;
    if (dk === todayKey) dailyCount += 1;
    if (dk === yesterdayKey) yesterdayCount += 1;
    if (dk >= weekStartKey && dk <= weekEndKey) weeklyCount += 1;
    if (dk.startsWith(currentMonthKey)) monthlyCount += 1;
    if (dk.startsWith(`${currentYear}-`)) {
      yearlyCount += 1;
      if (r.isCurrentlyActive) activeFromYearCount += 1;
    }
  }

  // Monthly comparison totals across HR vs All Org
  const hrMonthlyCount = allRecords.filter(
    (r) => r.isHrHire && r.hiredDateIST.startsWith(currentMonthKey)
  ).length;
  const allOrgMonthlyCount = allRecords.filter((r) =>
    r.hiredDateIST.startsWith(currentMonthKey)
  ).length;

  // Derived targets based on monthly aim (30/month)
  const dailyTarget = Math.max(1, Math.round(monthlyAim / 30));
  const weeklyTarget = Math.max(1, Math.round((monthlyAim * 7) / 30));
  const yearlyTarget = monthlyAim * 12;

  const monthlyRemaining = Math.max(0, monthlyAim - monthlyCount);
  const expectedByToday = Math.round(((monthlyAim * daysElapsed) / daysInMonth) * 10) / 10;
  const requiredDailyRate =
    monthlyRemaining === 0
      ? 0
      : daysRemaining > 0
      ? Math.round((monthlyRemaining / daysRemaining) * 10) / 10
      : monthlyRemaining;

  let status: HiringPaceStatus = 'ON_TRACK';
  if (monthlyCount >= monthlyAim) {
    status = 'ACHIEVED';
  } else if (expectedByToday > 0) {
    const paceRatio = monthlyCount / expectedByToday;
    if (paceRatio >= 0.85) status = 'ON_TRACK';
    else if (paceRatio >= 0.5) status = 'SLIGHTLY_BEHIND';
    else status = 'AT_RISK';
  }

  // 1. Daily series: last 14 days (oldest -> today)
  const dailySeries: HiringSeriesPoint[] = [];
  for (let offset = 13; offset >= 0; offset--) {
    const dk = addDaysToDateKey(todayKey, -offset);
    let hrCount = 0;
    let otherCount = 0;
    for (const r of allRecords) {
      if (r.hiredDateIST === dk) {
        if (r.isHrHire) hrCount += 1;
        else otherCount += 1;
      }
    }
    dailySeries.push({
      key: dk,
      label: formatShortDayLabel(dk),
      count: scope === 'hr' ? hrCount : hrCount + otherCount,
      hrCount,
      otherCount,
      target: dailyTarget,
    });
  }

  // 2. Weekly series: last 8 ISO weeks (oldest -> current week)
  const weeklySeries: HiringSeriesPoint[] = [];
  for (let wOffset = 7; wOffset >= 0; wOffset--) {
    const wStart = addDaysToDateKey(weekStartKey, -wOffset * 7);
    const wEnd = addDaysToDateKey(wStart, 6);
    let hrCount = 0;
    let otherCount = 0;
    for (const r of allRecords) {
      if (r.hiredDateIST >= wStart && r.hiredDateIST <= wEnd) {
        if (r.isHrHire) hrCount += 1;
        else otherCount += 1;
      }
    }
    weeklySeries.push({
      key: wStart,
      label: wOffset === 0 ? 'This Wk' : formatShortDayLabel(wStart),
      count: scope === 'hr' ? hrCount : hrCount + otherCount,
      hrCount,
      otherCount,
      target: weeklyTarget,
    });
  }

  // 3. Monthly series: Jan–Dec of current IST year
  const monthlySeries: HiringSeriesPoint[] = [];
  for (let m = 0; m < 12; m++) {
    const mKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
    let hrCount = 0;
    let otherCount = 0;
    for (const r of allRecords) {
      if (r.hiredDateIST.startsWith(mKey)) {
        if (r.isHrHire) hrCount += 1;
        else otherCount += 1;
      }
    }
    monthlySeries.push({
      key: mKey,
      label: SHORT_MONTHS[m],
      count: scope === 'hr' ? hrCount : hrCount + otherCount,
      hrCount,
      otherCount,
      target: monthlyAim,
    });
  }

  // 4. Yearly series: all distinct years present (always includes currentYear)
  const yearsSet = new Set<number>([currentYear]);
  for (const r of allRecords) {
    const yr = Number(r.hiredDateIST.slice(0, 4));
    if (!Number.isNaN(yr) && yr >= 2020) yearsSet.add(yr);
  }
  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
  const yearlySeries: HiringSeriesPoint[] = sortedYears.map((yr) => {
    const prefix = `${yr}-`;
    let hrCount = 0;
    let otherCount = 0;
    for (const r of allRecords) {
      if (r.hiredDateIST.startsWith(prefix)) {
        if (r.isHrHire) hrCount += 1;
        else otherCount += 1;
      }
    }
    return {
      key: String(yr),
      label: String(yr),
      count: scope === 'hr' ? hrCount : hrCount + otherCount,
      hrCount,
      otherCount,
      target: yearlyTarget,
    };
  });

  // 5. Recruiter breakdown (always across allRecords so Managers & HR see full attribution)
  const recruiterMap = new Map<string, RecruiterHiringSummary>();
  for (const r of allRecords) {
    if (!recruiterMap.has(r.hiredById)) {
      recruiterMap.set(r.hiredById, {
        recruiterId: r.hiredById,
        recruiterName: r.hiredByName,
        recruiterRole: r.hiredByRole,
        isHr: r.isHrHire,
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0,
      });
    }
    const entry = recruiterMap.get(r.hiredById)!;
    entry.total += 1;
    if (r.hiredDateIST === todayKey) entry.daily += 1;
    if (r.hiredDateIST >= weekStartKey && r.hiredDateIST <= weekEndKey) entry.weekly += 1;
    if (r.hiredDateIST.startsWith(currentMonthKey)) entry.monthly += 1;
    if (r.hiredDateIST.startsWith(`${currentYear}-`)) entry.yearly += 1;
  }

  const recruiters = Array.from(recruiterMap.values()).sort((a, b) => {
    if (a.isHr !== b.isHr) return a.isHr ? -1 : 1;
    if (b.monthly !== a.monthly) return b.monthly - a.monthly;
    return b.yearly - a.yearly;
  });

  return {
    referenceDateIST: todayKey,
    daily: {
      count: dailyCount,
      yesterdayCount,
      target: dailyTarget,
      remaining: Math.max(0, dailyTarget - dailyCount),
      percent: clampPercent(dailyCount, dailyTarget),
      dateLabel: `${formatShortDayLabel(todayKey)}, ${currentYear}`,
    },
    weekly: {
      count: weeklyCount,
      target: weeklyTarget,
      remaining: Math.max(0, weeklyTarget - weeklyCount),
      percent: clampPercent(weeklyCount, weeklyTarget),
      weekRangeLabel: `${formatShortDayLabel(weekStartKey)} – ${formatShortDayLabel(weekEndKey)}`,
      weekStartIST: weekStartKey,
      weekEndIST: weekEndKey,
    },
    monthly: {
      count: monthlyCount,
      target: monthlyAim,
      remaining: monthlyRemaining,
      percent: clampPercent(monthlyCount, monthlyAim),
      monthLabel: `${SHORT_MONTHS[currentMonthIdx]} ${currentYear}`,
      monthKey: currentMonthKey,
      daysElapsed,
      daysInMonth,
      daysRemaining,
      expectedByToday,
      requiredDailyRate,
      status,
    },
    yearly: {
      count: yearlyCount,
      activeFromYearCount,
      target: yearlyTarget,
      remaining: Math.max(0, yearlyTarget - yearlyCount),
      percent: clampPercent(yearlyCount, yearlyTarget),
      year: currentYear,
    },
    totals: {
      allTimeCount: scopedRecords.length,
      hrMonthlyCount,
      allOrgMonthlyCount,
      nonHrMonthlyCount: Math.max(0, allOrgMonthlyCount - hrMonthlyCount),
    },
    series: {
      daily: dailySeries,
      weekly: weeklySeries,
      monthly: monthlySeries,
      yearly: yearlySeries,
    },
    recruiters,
  };
}
