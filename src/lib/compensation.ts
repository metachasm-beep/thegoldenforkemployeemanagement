export const PT_SALES_CONSTANTS = {
  DOCUMENT_REF: 'ME/TGF/PT-SALES/2026',
  WEEKLY_HOURS_RANGE: '20–24 hrs/wk (4 hrs/day × 6 days)',
  FIELD_WINDOWS: '10:30 AM – 12:30 PM & 3:00 PM – 6:00 PM',
  MONTH_1_FIXED_FEE: 6000,
  MONTH_2_STANDARD_BASE: 18000,
  MONTHLY_DEMO_QUOTA: 15,
  MONTHLY_NET_REVENUE_TARGET: 60000,
  MONTHLY_NET_REVENUE_THRESHOLD: 59950,
  MONTH_1_TIER_2_MIN_REVENUE: 23990,
  UNDER_QUOTA_COMMISSION_RATE: 0.3,
  OVER_QUOTA_ACCELERATOR_RATE: 0.2,
  MILESTONE_NET_REVENUE_BLOCK: 1200000, // ₹12,00,000
  MILESTONE_BONUS_INR: 60000, // ₹60,000
  UPSELL_ATTRIBUTION_DAYS: 90,
  FREE_TRIAL_DAYS: 14,
} as const;

export const PT_SALES_SCHEDULE_A = [
  {
    code: 'CORE_POS_11999',
    shortName: '1. Core Dining & POS Engine',
    fullName: '1. Core Dining & POS Engine (Restaurant Only Preset)',
    netAnnualPrice: 11999,
    grossInvoiceWithGst: 14159,
    underQuotaCommission30: 3600,
    overQuotaAccelerator20: 2400,
    demoFeatures: [
      'Contactless QR Table Ordering & Digital Menus',
      'Waiter & Service Terminal with Realtime Status',
      'Multi-Station Kitchen Display System (KDS)',
      'Menu AI Scanner & Item Margin Analysis',
    ],
  },
  {
    code: 'HOTEL_PMS_14999',
    shortName: '2A. Hotel PMS (Standalone)',
    fullName: '2A. Hotel PMS & Accommodation (Hotel PMS Only Preset)',
    netAnnualPrice: 14999,
    grossInvoiceWithGst: 17699,
    underQuotaCommission30: 4500,
    overQuotaAccelerator20: 3000,
    demoFeatures: [
      '14-Day Visual Tape Chart & Quick Walk-in Intake',
      '4-Window Multi-Folio Splitting (Corporate BTC vs Personal)',
      'Mobile Housekeeping Stopwatch & Defect Auditing',
      'Regulatory Police Form B & FRRO Form C Compliance',
    ],
  },
  {
    code: 'HOTEL_PMS_BUNDLED_11999',
    shortName: '2B. Hotel PMS (Bundled w/ POS)',
    fullName: '2B. Hotel PMS & Accommodation (Bundled w/ Core POS)',
    netAnnualPrice: 11999,
    grossInvoiceWithGst: 14159,
    underQuotaCommission30: 3600,
    overQuotaAccelerator20: 2400,
    demoFeatures: [
      'Full Hotel PMS & Accommodation suite activated alongside Core Dining & POS Engine',
    ],
  },
  {
    code: 'INVENTORY_BOM_5999',
    shortName: '3. Inventory, Recipe BOM & COGS',
    fullName: '3. Inventory, Recipe BOM & Kitchen COGS',
    netAnnualPrice: 5999,
    grossInvoiceWithGst: 7079,
    underQuotaCommission30: 1800,
    overQuotaAccelerator20: 1200,
    demoFeatures: [
      'Raw Material Realtime Stock Balances & Reorders',
      'Recipe Bill of Materials (BOM) Linked to POS Sales',
      'Theoretical Consumption vs Physical Shrinkage Variance',
      'Kitchen Wastage & Spoilage Incident Logs',
    ],
  },
  {
    code: 'FINANCE_GST_5999',
    shortName: '4. Enterprise Finance & GST',
    fullName: '4. Enterprise Finance, GST & Statutory Tax',
    netAnnualPrice: 5999,
    grossInvoiceWithGst: 7079,
    underQuotaCommission30: 1800,
    overQuotaAccelerator20: 1200,
    demoFeatures: [
      'Shift Till Closures & Physical Cash Drawer Balancing',
      'P&L Statements, Balance Sheets & Expense Ledger',
      'Swiggy / Zomato / ONDC Net Payout Reconciliation',
      'Statutory GST Engine: GSTR-1 & GSTR-3B ITC Summary',
    ],
  },
  {
    code: 'STAFF_INTEL_3999',
    shortName: '5. Staff Intelligence & Ops',
    fullName: '5. Staff Intelligence & Productivity Operations',
    netAnnualPrice: 3999,
    grossInvoiceWithGst: 4719,
    underQuotaCommission30: 1200,
    overQuotaAccelerator20: 800,
    demoFeatures: [
      'Employee Clock-in/out Timesheets & Overtime Tracking',
      'Waitstaff Service Turnaround & Order Latency Metrics',
      'Housekeeper Room Cleaning Turnaround Speed Logs',
      'Equitable Service Charge & Tip Pool Distribution (FOH/BOH)',
    ],
  },
  {
    code: 'ALL_IN_ONE_34999',
    shortName: 'ALL-IN-ONE SUITE (All 5 Modules)',
    fullName: 'ALL-IN-ONE SUITE (All 5 Modules — Includes ₹4,996 Bundle Discount)',
    netAnnualPrice: 34999,
    grossInvoiceWithGst: 41299,
    underQuotaCommission30: 10500,
    overQuotaAccelerator20: 7000,
    demoFeatures: [
      'Complete 5-Module Hospitality Ecosystem (Includes ₹4,996 Suite Bundle Discount vs. separate modules)',
    ],
  },
] as const;

export function calculateModulesPricing(moduleCodes: string[]): {
  netAnnualRevenue: number;
  grossInvoiceWithGst: number;
  underQuotaCommission30: number;
  overQuotaAccelerator20: number;
} {
  if (!moduleCodes || moduleCodes.length === 0) {
    return {
      netAnnualRevenue: 0,
      grossInvoiceWithGst: 0,
      underQuotaCommission30: 0,
      overQuotaAccelerator20: 0,
    };
  }

  // If ALL_IN_ONE_34999 is selected, use suite pricing directly
  if (moduleCodes.includes('ALL_IN_ONE_34999')) {
    const suite = PT_SALES_SCHEDULE_A.find((m) => m.code === 'ALL_IN_ONE_34999')!;
    return {
      netAnnualRevenue: suite.netAnnualPrice,
      grossInvoiceWithGst: suite.grossInvoiceWithGst,
      underQuotaCommission30: suite.underQuotaCommission30,
      overQuotaAccelerator20: suite.overQuotaAccelerator20,
    };
  }

  let netAnnualRevenue = 0;
  let grossInvoiceWithGst = 0;
  let underQuotaCommission30 = 0;
  let overQuotaAccelerator20 = 0;

  for (const code of moduleCodes) {
    const found = PT_SALES_SCHEDULE_A.find((m) => m.code === code);
    if (found) {
      netAnnualRevenue += found.netAnnualPrice;
      grossInvoiceWithGst += found.grossInvoiceWithGst;
      underQuotaCommission30 += found.underQuotaCommission30;
      overQuotaAccelerator20 += found.overQuotaAccelerator20;
    }
  }

  return {
    netAnnualRevenue,
    grossInvoiceWithGst,
    underQuotaCommission30,
    overQuotaAccelerator20,
  };
}

export function getLeadNetAnnualRevenue(lead: {
  status?: string;
  customFields?: Record<string, any>;
}): number {
  const cf = (lead.customFields as Record<string, any>) || {};
  if (typeof cf.netAnnualRevenue === 'number' && cf.netAnnualRevenue > 0) {
    return cf.netAnnualRevenue;
  }
  if (typeof cf.netAnnualRevenue === 'string' && Number(cf.netAnnualRevenue) > 0) {
    return Number(cf.netAnnualRevenue);
  }
  if (Array.isArray(cf.subscribedModules) && cf.subscribedModules.length > 0) {
    const calc = calculateModulesPricing(cf.subscribedModules);
    if (calc.netAnnualRevenue > 0) return calc.netAnnualRevenue;
  }
  // Default to 1 Core Dining & POS Engine (₹11,999/yr) when a lead is Converted without explicit module selection
  return 11999;
}

export function isLeadVerifiedDemo(lead: {
  status?: string;
  nextAction?: string | null;
  customFields?: Record<string, any>;
}): boolean {
  const cf = (lead.customFields as Record<string, any>) || {};
  if (cf.cooDemoVerified === true || cf.liveDemoCompleted === true || cf.liveDemoCompleted === 'true') {
    return true;
  }
  if (
    lead.nextAction === 'Demo' ||
    lead.status === 'Proposal Sent' ||
    lead.status === 'Pending Verification' ||
    lead.status === 'Converted'
  ) {
    return true;
  }
  return false;
}

export function calculatePartTimeMonthlyCompensation(params: {
  empBaseSalary?: number;
  empProbationSalary?: number;
  netRevenueThisMonth: number;
  verifiedDemosThisMonth: number;
  isMonthOne: boolean;
  previousCumulativeNetRevenue: number;
  lastMonthNetRevenue?: number;
  joinedThisMonth?: boolean;
}) {
  const standardBase = params.empBaseSalary || PT_SALES_CONSTANTS.MONTH_2_STANDARD_BASE;
  const probationFixedFee = params.empProbationSalary || PT_SALES_CONSTANTS.MONTH_1_FIXED_FEE;
  const netRev = Math.max(0, params.netRevenueThisMonth);
  const demos = Math.max(0, params.verifiedDemosThisMonth);

  const meetsDemoGate = demos >= PT_SALES_CONSTANTS.MONTHLY_DEMO_QUOTA;
  const meetsRevenueQuota = netRev >= PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_THRESHOLD;

  let basePayout = 0;
  let underQuotaCommission = 0;
  let overQuotaAccelerator = 0;
  let willTerminate = false;
  let tierStatusLabel = '';

  if (params.isMonthOne) {
    // Month 1 Probationary Evaluation (3 Tiers)
    if (meetsRevenueQuota && meetsDemoGate) {
      // Tier 1: ≥ ₹59,950 Net Revenue + ≥ 15 Verified Demos
      basePayout = probationFixedFee;
      if (netRev > PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET) {
        overQuotaAccelerator = Math.round(
          (netRev - PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET) *
            PT_SALES_CONSTANTS.OVER_QUOTA_ACCELERATOR_RATE
        );
      }
      willTerminate = false;
      tierStatusLabel = 'Month 1 Tier 1 — Clears Probation (₹6,000 Fixed + 20% Accelerator)';
    } else if (netRev >= PT_SALES_CONSTANTS.MONTH_1_TIER_2_MIN_REVENUE && meetsDemoGate) {
      // Tier 2: ₹23,990 to ₹59,949 Net Revenue + ≥ 15 Verified Demos
      basePayout = probationFixedFee;
      willTerminate = true;
      tierStatusLabel = 'Month 1 Tier 2 — ₹6,000 Fixed Fee (Does Not Clear Probation)';
    } else {
      // Tier 3: < ₹23,990 Net Revenue OR < 15 Verified Demos
      basePayout = 0;
      willTerminate = true;
      tierStatusLabel = 'Month 1 Tier 3 — ₹0 Forfeited (< ₹23,990 Net Rev or < 15 Demos)';
    }
  } else {
    // Month 2+ Standard Part-Time Compensation
    const failedLastMonth =
      !params.joinedThisMonth &&
      (params.lastMonthNetRevenue ?? PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_THRESHOLD) <
        PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_THRESHOLD;

    if (meetsRevenueQuota && meetsDemoGate) {
      basePayout = standardBase;
      if (netRev > PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET) {
        overQuotaAccelerator = Math.round(
          (netRev - PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET) *
            PT_SALES_CONSTANTS.OVER_QUOTA_ACCELERATOR_RATE
        );
      }
      willTerminate = false;
      tierStatusLabel = 'Standard Quota Met — ₹18,000 Base + 20% Over-Quota Accelerator';
    } else {
      // Under Quota: ₹18,000 fixed base is void; compensated at 30% of settled Net Annual Subscription Revenue
      basePayout = 0;
      underQuotaAcceleratorOrCommission();
      function underQuotaAcceleratorOrCommission() {
        underQuotaCommission = Math.round(
          netRev * PT_SALES_CONSTANTS.UNDER_QUOTA_COMMISSION_RATE
        );
      }
      // Secondary Probation Remediation: if already in secondary probation from failing last month, triggers termination
      willTerminate = failedLastMonth;
      tierStatusLabel = failedLastMonth
        ? 'Secondary Probation Failed — 30% Pro-Rata Commission (Termination Risk)'
        : 'Under-Quota Pro-Rata — 30% Net Revenue Commission (Enters Secondary Probation)';
    }
  }

  // Cumulative ₹12,00,000 Revenue Milestone Bonus (₹60,000 per ₹12L block)
  const prevCumRev = Math.max(0, params.previousCumulativeNetRevenue);
  const totalCumRev = prevCumRev + netRev;
  const prevMilestones = Math.floor(prevCumRev / PT_SALES_CONSTANTS.MILESTONE_NET_REVENUE_BLOCK);
  const currMilestones = Math.floor(totalCumRev / PT_SALES_CONSTANTS.MILESTONE_NET_REVENUE_BLOCK);
  const newMilestones = Math.max(0, currMilestones - prevMilestones);
  const milestoneBonus = newMilestones * PT_SALES_CONSTANTS.MILESTONE_BONUS_INR;

  const performanceBonus = underQuotaCommission + overQuotaAccelerator;
  const grossPayout = basePayout + performanceBonus + milestoneBonus;
  const tdsDeduction = 0;
  const totalPayout = grossPayout;

  return {
    basePayout,
    underQuotaCommission,
    overQuotaAccelerator,
    performanceBonus,
    milestoneBonus,
    leadershipBonus: 0,
    grossPayout,
    tdsDeduction,
    totalPayout,
    willTerminate,
    tierStatusLabel,
  };
}

export function calculateMonthlyCompensation(
  empBaseSalary: number,
  empProbationSalary: number,
  empTarget: number,
  empCommissionRate: number,
  salesThisMonth: number,
  isMonthOne: boolean,
  previousCumulativeSales: number,
  lastMonthSales: number = 0,
  teamSales: number = 0
) {
  let basePayout = 0;
  let willTerminate = false;

  // Calculate target debt
  let target = empTarget;
  if (isMonthOne && lastMonthSales < empTarget) {
    target = empTarget + (empTarget - lastMonthSales);
  }

  if (isMonthOne) {
    if (salesThisMonth >= target) {
      basePayout = empBaseSalary;
    } else if (salesThisMonth >= 2) {
      basePayout = empProbationSalary;
      willTerminate = true;
    } else {
      basePayout = 0;
      willTerminate = true;
    }
  } else {
    if (salesThisMonth >= empTarget) {
      basePayout = empBaseSalary;
    } else if (salesThisMonth >= 2) {
      basePayout = salesThisMonth * 9000;
    } else {
      basePayout = 0;
    }
  }

  let performanceBonus = 0;
  if (salesThisMonth > empTarget) {
    performanceBonus = (salesThisMonth - empTarget) * empCommissionRate;
  }

  const totalSalesAfterThisMonth = previousCumulativeSales + salesThisMonth;
  const previousMilestonesHit = Math.floor(previousCumulativeSales / 100);
  const currentMilestonesHit = Math.floor(totalSalesAfterThisMonth / 100);
  const milestonesAchievedThisMonth = currentMilestonesHit - previousMilestonesHit;
  const milestoneBonus = milestonesAchievedThisMonth * 100000;

  const leadershipBonus = teamSales * 1000;

  const grossPayout = basePayout + performanceBonus + milestoneBonus + leadershipBonus;

  // Standard Indian TDS under 194J (Professional Services) is 10%
  const tdsDeduction = 0; // TDS disabled as per company tax slab
  const netPayout = grossPayout;

  return {
    basePayout,
    performanceBonus,
    milestoneBonus,
    leadershipBonus,
    grossPayout,
    tdsDeduction,
    totalPayout: netPayout,
    willTerminate: willTerminate || (!isMonthOne && salesThisMonth < empTarget),
  };
}
