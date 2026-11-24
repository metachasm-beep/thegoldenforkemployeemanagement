import {
  computeHiringAnalytics,
  getIsoWeekStartKey,
  HR_HIRING_TARGETS,
  HiringRecord,
  toIstDateKey,
} from './hiringMetrics';

function makeHire(overrides: Partial<HiringRecord> & { hiredAt: string }): HiringRecord {
  return {
    id: overrides.id || `log-${Math.random().toString(36).slice(2)}`,
    hiredEmployeeId: overrides.hiredEmployeeId || `emp-${Math.random().toString(36).slice(2)}`,
    hiredEmployeeName: overrides.hiredEmployeeName || 'Test Executive',
    hiredEmployeeRole: overrides.hiredEmployeeRole || 'Part-Time Sales Executive',
    hiredAt: overrides.hiredAt,
    hiredDateIST: overrides.hiredDateIST || toIstDateKey(overrides.hiredAt),
    hiredById: overrides.hiredById || 'hr-1',
    hiredByName: overrides.hiredByName || 'Gurnoor Chadha',
    hiredByRole: overrides.hiredByRole || 'HR',
    isHrHire: overrides.isHrHire !== undefined ? overrides.isHrHire : true,
    isCurrentlyActive: overrides.isCurrentlyActive !== undefined ? overrides.isCurrentlyActive : true,
  };
}

describe('HR Hiring Metrics Engine (30/month Aim)', () => {
  it('converts UTC timestamps accurately into IST calendar dates', () => {
    // 2026-11-24T20:45:00Z is 2026-11-25 02:15 IST
    expect(toIstDateKey('2026-11-24T20:45:00.000Z')).toBe('2026-11-25');
    // 2026-11-24T18:00:00Z is 2026-11-24 23:30 IST
    expect(toIstDateKey('2026-11-24T18:00:00.000Z')).toBe('2026-11-24');
  });

  it('computes ISO week start (Monday) accurately in IST', () => {
    expect(getIsoWeekStartKey('2026-11-25')).toBe('2026-11-23'); // Wed -> Mon
    expect(getIsoWeekStartKey('2026-11-29')).toBe('2026-11-23'); // Sun -> Mon
    expect(getIsoWeekStartKey('2026-11-23')).toBe('2026-11-23'); // Mon -> Mon
  });

  it('computes daily, weekly, monthly (aim = 30), and yearly HR vs All Org counts accurately', () => {
    // Reference time: 2026-11-25 02:15 IST (= 2026-11-24T20:45:00Z)
    const now = new Date('2026-11-24T20:45:00.000Z');
    const records: HiringRecord[] = [
      // Today (IST 2026-11-25): 1 HR hire
      makeHire({ hiredAt: '2026-11-24T20:00:00.000Z', hiredEmployeeName: 'Today HR Hire' }),
      // Earlier this week (Mon IST 2026-11-23): 2 HR hires + 1 Manager hire
      makeHire({ hiredAt: '2026-11-23T06:00:00.000Z', hiredEmployeeName: 'Mon HR Hire 1' }),
      makeHire({ hiredAt: '2026-11-23T07:00:00.000Z', hiredEmployeeName: 'Mon HR Hire 2' }),
      makeHire({
        hiredAt: '2026-11-23T02:00:00.000Z',
        hiredEmployeeName: 'Mon Manager Hire',
        hiredById: 'mgr-1',
        hiredByName: 'Metachasm Admin',
        hiredByRole: 'Manager',
        isHrHire: false,
      }),
      // Earlier this month (IST 2026-11-16): 4 HR hires
      makeHire({ hiredAt: '2026-11-16T05:30:00.000Z' }),
      makeHire({ hiredAt: '2026-11-16T05:31:00.000Z' }),
      makeHire({ hiredAt: '2026-11-16T05:32:00.000Z' }),
      makeHire({ hiredAt: '2026-11-16T05:33:00.000Z' }),
      // Earlier this year (IST 2026-09-30): 2 HR hires (offboarded)
      makeHire({ hiredAt: '2026-09-30T03:00:00.000Z', isCurrentlyActive: false }),
      makeHire({ hiredAt: '2026-09-30T03:05:00.000Z', isCurrentlyActive: false }),
    ];

    const hrStats = computeHiringAnalytics(records, 'hr', now);
    expect(HR_HIRING_TARGETS.MONTHLY_AIM).toBe(30);
    expect(hrStats.daily.count).toBe(1);
    expect(hrStats.weekly.count).toBe(3); // 1 today + 2 Mon
    expect(hrStats.monthly.count).toBe(7); // 3 this week + 4 on Nov 16
    expect(hrStats.monthly.target).toBe(30);
    expect(hrStats.monthly.remaining).toBe(23);
    expect(hrStats.yearly.count).toBe(9); // 7 in Nov + 2 in Sep
    expect(hrStats.yearly.target).toBe(360);
    expect(hrStats.yearly.activeFromYearCount).toBe(7);
    expect(hrStats.totals.nonHrMonthlyCount).toBe(1);

    const allStats = computeHiringAnalytics(records, 'all', now);
    expect(allStats.daily.count).toBe(1);
    expect(allStats.weekly.count).toBe(4);
    expect(allStats.monthly.count).toBe(8);
    expect(allStats.yearly.count).toBe(10);
    expect(allStats.recruiters.length).toBe(2);
    expect(allStats.recruiters[0].isHr).toBe(true);
    expect(allStats.recruiters[0].monthly).toBe(7);
    expect(allStats.recruiters[1].monthly).toBe(1);
  });

  it('marks monthly status as ACHIEVED once 30 hires are reached', () => {
    const now = new Date('2026-11-25T05:00:00.000Z');
    const thirtyHires: HiringRecord[] = Array.from({ length: 30 }, (_, idx) =>
      makeHire({
        id: `h-${idx}`,
        hiredEmployeeId: `e-${idx}`,
        hiredAt: `2026-11-${String((idx % 20) + 1).padStart(2, '0')}T06:00:00.000Z`,
      })
    );

    const stats = computeHiringAnalytics(thirtyHires, 'hr', now);
    expect(stats.monthly.count).toBe(30);
    expect(stats.monthly.remaining).toBe(0);
    expect(stats.monthly.percent).toBe(100);
    expect(stats.monthly.status).toBe('ACHIEVED');
    expect(stats.monthly.requiredDailyRate).toBe(0);
  });
});
