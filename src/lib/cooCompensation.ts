/**
 * Contractual Chief Operating Officer (COO) Compensation, Vesting & Buyback Engine
 * Reference: ME/TGF/EXEC-COO/2026-10-REV4 (Effective Date: 29/10/2026)
 * Principal: Metachasm Enterprises (Paul Marandi)
 * Executive: Ankur Otto (PAN: ABCPO5616K)
 */

export type CooTerminationType =
  | 'NONE'
  | 'VOLUNTARY_RESIGNATION'
  | 'WITHOUT_CAUSE'
  | 'COMPANY_MATERIAL_BREACH'
  | 'FOR_CAUSE';

export type CooPillarCode =
  | 'PILLAR_1_ONBOARDING'
  | 'PILLAR_2_FIELD_GOV'
  | 'PILLAR_3_RETENTION'
  | 'PILLAR_4_B2B_DELIVERY'
  | 'PILLAR_5_ALIGNMENT';

export const COO_PILLARS: {
  code: CooPillarCode;
  shortLabel: string;
  fullTitle: string;
  sectionRef: string;
  description: string;
}[] = [
  {
    code: 'PILLAR_1_ONBOARDING',
    shortLabel: 'Pillar 1: Venue Onboarding & Setup',
    fullTitle: 'End-to-End Merchant Onboarding & Technical Implementation',
    sectionRef: 'Section 3.1',
    description:
      'Rapid venue deployment SLAs and modular setup (Core POS ₹11,999/yr, Hotel PMS ₹14,999/yr, Inventory BOM ₹5,999/yr, Finance & GST ₹5,999/yr, Staff Intel ₹3,999/yr).',
  },
  {
    code: 'PILLAR_2_FIELD_GOV',
    shortLabel: 'Pillar 2: Field Gov & Demo QA',
    fullTitle: 'Field Operations Governance, Demo QA & Territory Logistics',
    sectionRef: 'Section 3.2',
    description:
      'Field SOP enforcement, auditing daily visit logs & geo-tagged attendance, live demo verification on CRM, and pitch kit readiness.',
  },
  {
    code: 'PILLAR_3_RETENTION',
    shortLabel: 'Pillar 3: 21-Day Trial & Retention',
    fullTitle: 'Trial-to-Paid Conversion Operations, Customer Success & Retention',
    sectionRef: 'Section 3.3',
    description:
      '21-Day Free Trial usage monitoring, staff training interventions, merchant support desk, quarterly health audits, and 90-day All-in-One Suite upgrades (₹34,999/yr).',
  },
  {
    code: 'PILLAR_4_B2B_DELIVERY',
    shortLabel: 'Pillar 4: B2B Project Delivery',
    fullTitle: 'B2B Client Project Delivery & Internal Process Operations',
    sectionRef: 'Section 3.4',
    description:
      'Custom B2B web/software project timelines, staging reviews, milestone triggers, and SAC 998311 GST compliance & contract archiving.',
  },
  {
    code: 'PILLAR_5_ALIGNMENT',
    shortLabel: 'Pillar 5: Founder & CEO Alignment',
    fullTitle: 'Cross-Functional Alignment (Founder & CEO Interface)',
    sectionRef: 'Section 3.5',
    description:
      'Product-Operations technical feedback briefs for engineering and weekly commercial-operational pipeline sync across India, Europe, and North America.',
  },
];

export const GOLDEN_FORK_MODULES = [
  { code: 'CORE_POS_11999', label: 'Core Dining & POS Engine', annualPrice: 11999 },
  { code: 'HOTEL_PMS_14999', label: 'Hotel PMS & Accommodation (Standalone)', annualPrice: 14999 },
  { code: 'HOTEL_PMS_BUNDLED_11999', label: 'Hotel PMS & Accommodation (Bundled)', annualPrice: 11999 },
  { code: 'INVENTORY_BOM_5999', label: 'Inventory & Recipe BOM', annualPrice: 5999 },
  { code: 'FINANCE_GST_5999', label: 'Enterprise Finance, Reconciliation & GST', annualPrice: 5999 },
  { code: 'STAFF_INTEL_3999', label: 'Staff Intelligence & Tip-Pool', annualPrice: 3999 },
  { code: 'ALL_IN_ONE_34999', label: 'All-in-One Hospitality Suite (90-Day Upgrade)', annualPrice: 34999 },
] as const;

export const COO_CONTRACT_CONSTANTS = {
  DOCUMENT_REF: 'ME/TGF/EXEC-COO/2026-10-REV4',
  EFFECTIVE_DATE: '2026-10-29',
  LOCK_IN_END_DATE: '2028-10-29', // 24 calendar months from Effective Date (Sec 5.1)
  EXECUTIVE_NAME: 'Ankur Otto',
  EXECUTIVE_EMAIL: 'ankurotto@gmail.com',
  EXECUTIVE_PAN: 'ABCPO5616K',
  PRINCIPAL_NAME: 'Paul Marandi',
  ENTITY_NAME: 'Metachasm Enterprises',
  GSTIN: '09DRPPM2400H1ZQ',
  SBI_ACCOUNT_NO: '36048161321',
  MIN_WEEKLY_HOURS: 15,
  MIN_MONTHLY_HOURS_QUALIFICATION: 60, // 4 weeks * 15h/wk threshold
  STRETCH_MONTHLY_HOURS_TARGET: 80, // Sec 2.2 / 2.3 indicator
  MAX_EXPENSE_APPROVAL_INR: 10000, // Sec 1.3 Fiduciary CapEx / Vendor limit
  ACTIVE_REVENUE_SHARE_PERCENT: 3.0, // Sec 4.2.1
  FULL_VESTING_MONTHS: 18, // Sec 4.2.2
  CLIFF_MONTHS: 6, // Sec 4.2.2
  MAX_EMERGENCY_PAUSE_DAYS: 60, // Sec 4.2.4
};

export interface CooVestingInput {
  completedMonths: number;
  terminationType?: CooTerminationType;
  forCauseBreach?: boolean;
}

export interface CooVestingResult {
  completedMonths: number;
  vestedGrantPercentage: number; // 0 to 100
  survivingRevenueSharePercent: number; // 0.00 to 3.00
  ttmBuyoutMultiple: number; // 0, 3.0, or 4.0
  tierLabel: string;
}

export function calculateCooVesting(input: CooVestingInput): CooVestingResult {
  const completedMonths = Math.max(0, Math.floor(input.completedMonths));
  const terminationType = input.terminationType || 'NONE';

  if (input.forCauseBreach || terminationType === 'FOR_CAUSE') {
    return {
      completedMonths,
      vestedGrantPercentage: 0,
      survivingRevenueSharePercent: 0,
      ttmBuyoutMultiple: 0,
      tierLabel: 'Forfeited for Cause / Covenant Breach',
    };
  }

  // Section 4.2.2: Initial 6-Month Cliff
  if (completedMonths < 6) {
    return {
      completedMonths,
      vestedGrantPercentage: 0,
      survivingRevenueSharePercent: 0,
      ttmBuyoutMultiple: 0,
      tierLabel: 'Pre-Cliff (< 6 Completed Months — 0% Vested)',
    };
  }

  // Full Vesting at 18+ Completed Months
  if (completedMonths >= 18) {
    return {
      completedMonths,
      vestedGrantPercentage: 100,
      survivingRevenueSharePercent: 3.0,
      ttmBuyoutMultiple: 4.0,
      tierLabel: 'Fully Vested (18+ Completed Months — 100% / 3.00% Share)',
    };
  }

  // Section 4.2.3: Pro-Rata Vesting on Termination Without Cause or Company Breach (Post-6 Months)
  if (terminationType === 'WITHOUT_CAUSE' || terminationType === 'COMPANY_MATERIAL_BREACH') {
    const proRataGrantPct = Number(((completedMonths / 18) * 100).toFixed(2));
    const proRataSharePct = Number(((completedMonths / 18) * 3.0).toFixed(4));
    return {
      completedMonths,
      vestedGrantPercentage: proRataGrantPct,
      survivingRevenueSharePercent: proRataSharePct,
      ttmBuyoutMultiple: 3.0,
      tierLabel: `Pro-Rata Vested (${completedMonths}/18 Months — ${proRataSharePct}% Share)`,
    };
  }

  // Section 4.2.2: Standard Milestone Tiers (Active or Voluntary Resignation)
  if (completedMonths >= 12) {
    return {
      completedMonths,
      vestedGrantPercentage: 50,
      survivingRevenueSharePercent: 1.5,
      ttmBuyoutMultiple: 3.0,
      tierLabel: '12-Month Milestone Tier (50% Vested / 1.50% Share)',
    };
  }

  return {
    completedMonths,
    vestedGrantPercentage: 25,
    survivingRevenueSharePercent: 0.75,
    ttmBuyoutMultiple: 3.0,
    tierLabel: '6-Month Cliff Achieved (25% Vested / 0.75% Share)',
  };
}

export interface NetRealizedRevenueInput {
  grossSettledInSbi: number;
  gstExcluded: number;
  gatewayAndRefundDeductions: number;
  sharePercent?: number; // Defaults to 3.0% during active service
  tdsRatePercent?: number; // Defaults to 10.0%
}

export interface NetRealizedRevenueResult {
  netRealizedRevenue: number;
  sharePercent: number;
  grossCooPayout: number;
  tdsDeducted: number;
  netCooPayout: number;
}

export function calculateNetRealizedRevenueShare(
  input: NetRealizedRevenueInput
): NetRealizedRevenueResult {
  const sharePercent = input.sharePercent ?? 3.0;
  const tdsRatePercent = input.tdsRatePercent ?? 10.0;

  const netRealizedRevenue = Math.max(
    0,
    Number(
      (
        input.grossSettledInSbi -
        input.gstExcluded -
        input.gatewayAndRefundDeductions
      ).toFixed(2)
    )
  );

  const grossCooPayout = Number(((netRealizedRevenue * sharePercent) / 100).toFixed(2));
  const tdsDeducted = Number(((grossCooPayout * tdsRatePercent) / 100).toFixed(2));
  const netCooPayout = Number((grossCooPayout - tdsDeducted).toFixed(2));

  return {
    netRealizedRevenue,
    sharePercent,
    grossCooPayout,
    tdsDeducted,
    netCooPayout,
  };
}

export interface CooBuybackInput {
  completedMonths: number;
  survivingRevenueSharePercent: number;
  companyFmv: number;
  ttmRealizedPayouts: number;
}

export interface CooBuybackResult {
  fmvShareAmount: number;
  ttmMultiple: number;
  ttmFloorAmount: number;
  bindingBuybackPrice: number;
  governingMethod: 'FMV_SHARE' | 'TTM_FLOOR' | 'NOT_VESTED';
}

export function calculateCooBuybackPrice(input: CooBuybackInput): CooBuybackResult {
  if (input.completedMonths < 6 || input.survivingRevenueSharePercent <= 0) {
    return {
      fmvShareAmount: 0,
      ttmMultiple: 0,
      ttmFloorAmount: 0,
      bindingBuybackPrice: 0,
      governingMethod: 'NOT_VESTED',
    };
  }

  const ttmMultiple = input.completedMonths >= 18 ? 4.0 : 3.0;
  const fmvShareAmount = Number(
    ((Math.max(0, input.companyFmv) * input.survivingRevenueSharePercent) / 100).toFixed(2)
  );
  const ttmFloorAmount = Number((Math.max(0, input.ttmRealizedPayouts) * ttmMultiple).toFixed(2));
  const bindingBuybackPrice = Math.max(fmvShareAmount, ttmFloorAmount);

  return {
    fmvShareAmount,
    ttmMultiple,
    ttmFloorAmount,
    bindingBuybackPrice,
    governingMethod: fmvShareAmount >= ttmFloorAmount ? 'FMV_SHARE' : 'TTM_FLOOR',
  };
}

export interface WeeklyComplianceEntry {
  weekStartDate: string;
  hoursLogged: number;
  reportSubmittedOnTime: boolean;
  approvedException?: boolean;
}

export function evaluateWeeklyCompliance(weeks: WeeklyComplianceEntry[]): {
  consecutiveFailedWeeks: number;
  triggersCureNoticeAlert: boolean;
} {
  const sorted = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  let consecutiveFailedWeeks = 0;
  let maxConsecutive = 0;

  for (const w of sorted) {
    const passed =
      w.approvedException ||
      (w.hoursLogged >= COO_CONTRACT_CONSTANTS.MIN_WEEKLY_HOURS && w.reportSubmittedOnTime);
    if (!passed) {
      consecutiveFailedWeeks += 1;
      if (consecutiveFailedWeeks > maxConsecutive) {
        maxConsecutive = consecutiveFailedWeeks;
      }
    } else {
      consecutiveFailedWeeks = 0;
    }
  }

  return {
    consecutiveFailedWeeks,
    triggersCureNoticeAlert: maxConsecutive >= 2,
  };
}
