import { describe, it, expect } from 'vitest';
import {
  calculateCooVesting,
  calculateNetRealizedRevenueShare,
  calculateCooBuybackPrice,
  evaluateWeeklyCompliance,
} from '../cooCompensation';

describe('COO Compensation, Graded Vesting & Buyback Engine (ME/TGF/EXEC-COO/2026-10-REV4)', () => {
  it('enforces 0% vesting before 6 Completed Months (Initial Cliff - Sec 4.2.2)', () => {
    const res = calculateCooVesting({
      completedMonths: 5,
      terminationType: 'NONE',
      forCauseBreach: false,
    });
    expect(res.vestedGrantPercentage).toBe(0);
    expect(res.survivingRevenueSharePercent).toBe(0);
    expect(res.ttmBuyoutMultiple).toBe(0);
  });

  it('vests 25% (0.75% surviving share, 3.0x TTM floor) at 6 Completed Months and holds tier on voluntary resignation at 9 months', () => {
    const res = calculateCooVesting({
      completedMonths: 9,
      terminationType: 'VOLUNTARY_RESIGNATION',
      forCauseBreach: false,
    });
    expect(res.vestedGrantPercentage).toBe(25);
    expect(res.survivingRevenueSharePercent).toBe(0.75);
    expect(res.ttmBuyoutMultiple).toBe(3.0);
  });

  it('grants pro-rata vesting ((Completed Months / 18) * 3.00%) on termination without Cause post-6 months (Sec 4.2.3)', () => {
    const res = calculateCooVesting({
      completedMonths: 9,
      terminationType: 'WITHOUT_CAUSE',
      forCauseBreach: false,
    });
    expect(res.vestedGrantPercentage).toBe(50);
    expect(res.survivingRevenueSharePercent).toBe(1.5);
    expect(res.ttmBuyoutMultiple).toBe(3.0);
  });

  it('vests 100% (3.00% surviving share, 4.0x TTM floor) at 18 Completed Months', () => {
    const res = calculateCooVesting({
      completedMonths: 18,
      terminationType: 'NONE',
      forCauseBreach: false,
    });
    expect(res.vestedGrantPercentage).toBe(100);
    expect(res.survivingRevenueSharePercent).toBe(3.0);
    expect(res.ttmBuyoutMultiple).toBe(4.0);
  });

  it('forfeits 100% of vested and unvested rights on termination for Cause or covenant breach (Sec 4.4)', () => {
    const res = calculateCooVesting({
      completedMonths: 18,
      terminationType: 'FOR_CAUSE',
      forCauseBreach: true,
    });
    expect(res.vestedGrantPercentage).toBe(0);
    expect(res.survivingRevenueSharePercent).toBe(0);
  });

  it('calculates Net Realized Monthly Revenue excluding GST, gateway fees, and refunds (Sec 4.3)', () => {
    const payout = calculateNetRealizedRevenueShare({
      grossSettledInSbi: 1180000,
      gstExcluded: 180000,
      gatewayAndRefundDeductions: 20000,
      sharePercent: 3.0,
      tdsRatePercent: 10.0,
    });
    expect(payout.netRealizedRevenue).toBe(980000);
    expect(payout.grossCooPayout).toBe(29400);
    expect(payout.tdsDeducted).toBe(2940);
    expect(payout.netCooPayout).toBe(26460);
  });

  it('calculates Buyback Price as the HIGHER of FMV Share or Tiered TTM Payout Multiple Floor (Sec 5.2)', () => {
    const buybackFmvWins = calculateCooBuybackPrice({
      completedMonths: 18,
      survivingRevenueSharePercent: 3.0,
      companyFmv: 50000000, // 5 Cr -> 3% = 15,00,000
      ttmRealizedPayouts: 300000, // 4x = 12,00,000
    });
    expect(buybackFmvWins.fmvShareAmount).toBe(1500000);
    expect(buybackFmvWins.ttmFloorAmount).toBe(1200000);
    expect(buybackFmvWins.bindingBuybackPrice).toBe(1500000);
    expect(buybackFmvWins.governingMethod).toBe('FMV_SHARE');

    const buybackTtmWins = calculateCooBuybackPrice({
      completedMonths: 12,
      survivingRevenueSharePercent: 1.5,
      companyFmv: 10000000, // 1 Cr -> 1.5% = 1,50,000
      ttmRealizedPayouts: 100000, // 3x = 3,00,000
    });
    expect(buybackTtmWins.bindingBuybackPrice).toBe(300000);
    expect(buybackTtmWins.governingMethod).toBe('TTM_FLOOR');
  });

  it('flags Cure Notice alert when 2 consecutive weeks fail the 15h minimum or Monday 10 AM report (Sec 4.4)', () => {
    const compliance = evaluateWeeklyCompliance([
      { weekStartDate: '2026-11-02', hoursLogged: 12, reportSubmittedOnTime: true, approvedException: false },
      { weekStartDate: '2026-11-09', hoursLogged: 16, reportSubmittedOnTime: false, approvedException: false },
    ]);
    expect(compliance.consecutiveFailedWeeks).toBe(2);
    expect(compliance.triggersCureNoticeAlert).toBe(true);
  });
});
