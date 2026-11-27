import {
  calculateCloserMonthlyCompensation,
  CLOSER_CONSTANTS,
  computeCloserBatchMetrics,
  evaluateCloserEodSubmission,
  partitionCloserQueue,
  selectSmartFillLeads,
} from './closerEngine';
import { generateSalaryReport } from './payroll';
import { CloserLeadAssignmentRecord, Employee, Lead } from '@/types';

function makeLead(overrides: Partial<Lead> & { leadId: string }): Lead {
  return {
    leadId: overrides.leadId,
    employeeId: overrides.employeeId || 'setter-1',
    closerId: overrides.closerId ?? null,
    date: overrides.date || '2026-11-27',
    status: overrides.status || 'Lead Captured',
    name: overrides.name || 'Test Venue',
    email: overrides.email ?? null,
    phone: overrides.phone ?? '+91 9876543210',
    linkedIn: null,
    objections: null,
    nextAction: null,
    followUp: '',
    notes: overrides.notes || 'Interested in POS',
    createdAt: overrides.createdAt || new Date('2026-11-25T05:00:00Z'),
    convertedAt: overrides.convertedAt,
    customFields: overrides.customFields || { netAnnualRevenue: 34999 },
  };
}

function makeAssignment(
  overrides: Partial<CloserLeadAssignmentRecord> & { id: string; leadId: string }
): CloserLeadAssignmentRecord {
  return {
    id: overrides.id,
    leadId: overrides.leadId,
    closerId: overrides.closerId || 'closer-1',
    assignedById: overrides.assignedById || 'coo-1',
    batchDate: overrides.batchDate || '2026-11-27',
    slotNumber: overrides.slotNumber || 1,
    cooBriefingNote: overrides.cooBriefingNote ?? null,
    disposition: overrides.disposition || 'UNWORKED',
    callAttempts: overrides.callAttempts ?? 0,
    closerNotes: overrides.closerNotes || '',
    nextFollowUpDate: overrides.nextFollowUpDate ?? null,
    assignedAt: overrides.assignedAt || '2026-11-27T04:30:00.000Z',
    firstTouchedAt: overrides.firstTouchedAt ?? null,
    lastWorkedAt: overrides.lastWorkedAt ?? null,
    closedAt: overrides.closedAt ?? null,
    isRecycled: overrides.isRecycled ?? false,
  };
}

describe('Closer Engine (Probation ₹30k -> ₹60k + 10% Incentive, 9 PM IST EOD, Carry-Over)', () => {
  it('pays ₹30,000 base during 2-month probation (Month 1 & Month 2) + 10% of closed sales', () => {
    const m1 = calculateCloserMonthlyCompensation({
      monthsSinceJoin: 0,
      netRevenueClosedThisMonth: 120000,
      conversionsThisMonth: 4,
    });
    expect(m1.isProbationPeriod).toBe(true);
    expect(m1.basePayout).toBe(30000);
    expect(m1.incentivePayout).toBe(12000); // 10% of 1,20,000
    expect(m1.totalPayout).toBe(42000);

    const m2 = calculateCloserMonthlyCompensation({
      monthsSinceJoin: 1,
      netRevenueClosedThisMonth: 34999,
      conversionsThisMonth: 1,
    });
    expect(m2.isProbationPeriod).toBe(true);
    expect(m2.basePayout).toBe(30000);
    expect(m2.incentivePayout).toBe(3500); // Math.round(3499.9)
    expect(m2.totalPayout).toBe(33500);
  });

  it('graduates to ₹60,000 post-probation base in Month 3+ + 10% closed sales incentive', () => {
    const m3 = calculateCloserMonthlyCompensation({
      monthsSinceJoin: 2,
      netRevenueClosedThisMonth: 250000,
      conversionsThisMonth: 8,
    });
    expect(m3.isProbationPeriod).toBe(false);
    expect(m3.basePayout).toBe(60000);
    expect(m3.incentivePayout).toBe(25000);
    expect(m3.totalPayout).toBe(85000);
  });

  it('evaluates EOD deadline strictly at 9:00 PM IST (15:30 UTC)', () => {
    expect(CLOSER_CONSTANTS.EOD_DEADLINE_HOUR_IST).toBe(21);
    // 8:55 PM IST on 2026-11-27 == 15:25 UTC -> On Time
    const before = evaluateCloserEodSubmission(
      '2026-11-27',
      new Date('2026-11-27T15:25:00.000Z')
    );
    expect(before.isOnTime).toBe(true);

    // 9:05 PM IST on 2026-11-27 == 15:35 UTC -> Late
    const after = evaluateCloserEodSubmission(
      '2026-11-27',
      new Date('2026-11-27T15:35:00.000Z')
    );
    expect(after.isOnTime).toBe(false);
  });

  it('keeps prior-day Follow-Up & Proposal Sent leads in Carry-Over without reducing today fresh 10 batch', () => {
    const l1 = makeLead({ leadId: 'l-prev-followup', status: 'Lead Captured' });
    const l2 = makeLead({ leadId: 'l-prev-proposal', status: 'Proposal Sent' });
    const l3 = makeLead({ leadId: 'l-prev-lost', status: 'Lost' });
    const lToday = makeLead({ leadId: 'l-today-1', status: 'Lead Captured' });

    const leadsMap = new Map<string, Lead>([
      [l1.leadId, l1],
      [l2.leadId, l2],
      [l3.leadId, l3],
      [lToday.leadId, lToday],
    ]);

    const assignments: CloserLeadAssignmentRecord[] = [
      makeAssignment({
        id: 'a1',
        leadId: 'l-prev-followup',
        batchDate: '2026-11-26',
        disposition: 'FOLLOW_UP',
      }),
      makeAssignment({
        id: 'a2',
        leadId: 'l-prev-proposal',
        batchDate: '2026-11-26',
        disposition: 'PROPOSAL_SENT',
      }),
      makeAssignment({
        id: 'a3',
        leadId: 'l-prev-lost',
        batchDate: '2026-11-26',
        disposition: 'CLOSED_LOST',
      }),
      makeAssignment({
        id: 'a4',
        leadId: 'l-today-1',
        batchDate: '2026-11-27',
        slotNumber: 1,
        disposition: 'UNWORKED',
      }),
    ];

    const { todayBatch, carryOverQueue } = partitionCloserQueue(
      assignments,
      leadsMap,
      '2026-11-27'
    );
    expect(todayBatch).toHaveLength(1);
    expect(todayBatch[0].leadId).toBe('l-today-1');
    expect(carryOverQueue.map((c) => c.leadId).sort()).toEqual([
      'l-prev-followup',
      'l-prev-proposal',
    ]);
  });

  it('tracks unworkedCount accurately for EOD alerts even when partially worked', () => {
    const leadsMap = new Map<string, Lead>([
      ['l1', makeLead({ leadId: 'l1', status: 'Converted', customFields: { netAnnualRevenue: 34999 } })],
      ['l2', makeLead({ leadId: 'l2', status: 'Proposal Sent' })],
      ['l3', makeLead({ leadId: 'l3', status: 'Lead Captured' })],
    ]);

    const batch: CloserLeadAssignmentRecord[] = [
      makeAssignment({
        id: 'a1',
        leadId: 'l1',
        disposition: 'CLOSED_WON',
        firstTouchedAt: '2026-11-27T05:00:00.000Z', // 30m after assignedAt
      }),
      makeAssignment({
        id: 'a2',
        leadId: 'l2',
        disposition: 'PROPOSAL_SENT',
        firstTouchedAt: '2026-11-27T05:30:00.000Z', // 60m after assignedAt
      }),
      makeAssignment({
        id: 'a3',
        leadId: 'l3',
        disposition: 'UNWORKED',
      }),
    ];

    const metrics = computeCloserBatchMetrics(batch, leadsMap);
    expect(metrics.assignedCount).toBe(3);
    expect(metrics.workedCount).toBe(2);
    expect(metrics.unworkedCount).toBe(1);
    expect(metrics.closedWonCount).toBe(1);
    expect(metrics.netRevenueClosed).toBe(34999);
    expect(metrics.avgTimeToFirstTouchMins).toBe(45);
  });

  it('prioritizes Proposal Sent and Verified Demo leads in Smart Fill', () => {
    const leads = [
      makeLead({ leadId: 'cold', status: 'Lead Captured', phone: null, notes: '' }),
      makeLead({ leadId: 'proposal', status: 'Proposal Sent', phone: '+91 9999999999' }),
      makeLead({
        leadId: 'verified-demo',
        status: 'Lead Captured',
        phone: '+91 8888888888',
        customFields: { cooDemoVerified: true, liveDemoCompleted: true },
      }),
    ];
    const picked = selectSmartFillLeads(leads, 2);
    expect(picked.map((l) => l.leadId)).toEqual(['proposal', 'verified-demo']);
  });

  it('gives full conversion & revenue credit to the Closer when closing a lead generated by an active Sales Executive', () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const employees: Employee[] = [
      {
        id: 'exec-1',
        name: 'Active Setter',
        role: 'Sales Executive',
        email: 'setter@example.com',
        startDate: todayIso,
        baseSalary: 45000,
        probationSalary: 15000,
        commissionRate: 5000,
        target: 5,
        probationDuration: 1,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
        sessionVersion: 1,
      },
      {
        id: 'closer-1',
        name: 'Star Closer',
        role: 'Closer',
        email: 'closer@example.com',
        startDate: todayIso,
        baseSalary: 60000,
        probationSalary: 30000,
        commissionRate: 10,
        target: 10,
        probationDuration: 2,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
        sessionVersion: 1,
      },
    ];

    const leads: Lead[] = [
      makeLead({
        leadId: 'deal-1',
        employeeId: 'exec-1',
        closerId: 'closer-1',
        date: todayIso,
        status: 'Converted',
        convertedAt: new Date(),
        customFields: { netAnnualRevenue: 50000 },
      }),
    ];

    const reports = generateSalaryReport(employees, leads);
    const setterReport = reports.find((r) => r.employeeId === 'exec-1')!;
    const closerReport = reports.find((r) => r.employeeId === 'closer-1')!;

    // Closer gets full conversion credit & 10% incentive on ₹50,000 (= ₹5,000) + ₹30,000 probation base
    expect(closerReport.isCloser).toBe(true);
    expect(closerReport.conversions).toBe(1);
    expect(closerReport.netRevenueThisMonth).toBe(50000);
    expect(closerReport.baseSalary).toBe(30000);
    expect(closerReport.commission).toBe(5000);
    expect(closerReport.totalPayout).toBe(35000);

    // Active Setter keeps sourcing count (leads = 1) but does NOT double-count conversion
    expect(setterReport.leads).toBe(1);
    expect(setterReport.conversions).toBe(0);
  });
});
