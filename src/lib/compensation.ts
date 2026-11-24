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
  FREE_TRIAL_DAYS: 21,
} as const;

export type PricingRegion = 'india' | 'europe' | 'na';
export type BillingModel = 'annual_modular' | 'monthly_2999' | 'payg_2_percent';

export const GOLDEN_FORK_REGIONS: {
  id: PricingRegion;
  label: string;
  currencySymbol: string;
  allInOneAnnual: number;
  allInOneMonthlyEq: number;
  allInOneRegularSum: number;
  allInOneSavings: number;
  monthlyFlatPrice: number;
  inrExchangeRate: number;
}[] = [
  {
    id: 'india',
    label: 'India (₹)',
    currencySymbol: '₹',
    allInOneAnnual: 34999,
    allInOneMonthlyEq: 2917,
    allInOneRegularSum: 39995,
    allInOneSavings: 4996,
    monthlyFlatPrice: 2999,
    inrExchangeRate: 1,
  },
  {
    id: 'europe',
    label: 'Europe (€)',
    currencySymbol: '€',
    allInOneAnnual: 399,
    allInOneMonthlyEq: 33,
    allInOneRegularSum: 485,
    allInOneSavings: 86,
    monthlyFlatPrice: 39,
    inrExchangeRate: 90,
  },
  {
    id: 'na',
    label: 'North America ($)',
    currencySymbol: '$',
    allInOneAnnual: 499,
    allInOneMonthlyEq: 42,
    allInOneRegularSum: 595,
    allInOneSavings: 96,
    monthlyFlatPrice: 49,
    inrExchangeRate: 84,
  },
];

export const PT_SALES_SCHEDULE_A = [
  {
    code: 'CORE_POS_11999',
    webId: 'pos_core',
    shortName: '1. Core Dining, Delivery & POS Engine',
    fullName: '1. Core Dining, Delivery & POS Engine (Restaurant Only Preset)',
    tagline: 'Order Management, Direct Online Delivery (0% Comm), Digital QR, KDS & Waitstaff App',
    badge: 'Popular',
    netAnnualPrice: 11999,
    monthlyEqInr: 999,
    annualPriceEur: 149,
    monthlyEqEur: 12,
    annualPriceUsd: 179,
    monthlyEqUsd: 15,
    grossInvoiceWithGst: 14159,
    underQuotaCommission30: 3600,
    overQuotaAccelerator20: 2400,
    demoFeatures: [
      'Contactless QR Table Ordering & Digital Menus',
      'Direct Online Delivery & Takeaway Storefront (0% Commission)',
      'Waiter & Service Terminal with Realtime Status',
      'Multi-Station Kitchen Display System (KDS)',
      'Menu AI Scanner & Item Margin Analysis',
      '13 Sales Reports (DSR, Item Velocity, Category Mix)',
    ],
  },
  {
    code: 'HOTEL_PMS_14999',
    webId: 'hotel_pms',
    shortName: '2A. Hotel PMS & Accommodation (Standalone)',
    fullName: '2A. Hotel PMS & Accommodation (Hotel PMS Only Preset)',
    tagline: 'Tape Chart, Real-Time 50+ OTA Channel Manager, FRRO Form-C XML & Split-GST Billing',
    badge: 'Hospitality',
    netAnnualPrice: 14999,
    monthlyEqInr: 1249,
    annualPriceEur: 179,
    monthlyEqEur: 15,
    annualPriceUsd: 219,
    monthlyEqUsd: 18,
    grossInvoiceWithGst: 17699,
    underQuotaCommission30: 4500,
    overQuotaAccelerator20: 3000,
    demoFeatures: [
      '14-Day Visual Tape Chart & 60-Second Walk-in Intake',
      '4-Window Multi-Folio & Split GST Slabs (SAC 996311 12%/18% & 5% F&B + B2B IGST)',
      'Real-Time Two-Way OTA Channel Manager (MMT, Booking.com, Agoda, Expedia, Airbnb ARI Push)',
      'Bureau of Immigration FRRO Form-C XML/CSV & Aadhaar/Passport Camera OCR Auto-Fill',
      'Mobile Housekeeping Stopwatch, Room Door QR Physical Presence Scan & Defect Auditing',
    ],
  },
  {
    code: 'HOTEL_PMS_BUNDLED_11999',
    webId: 'hotel_pms_bundled',
    shortName: '2B. Hotel PMS (Bundled w/ Core POS — Saves ₹3,000)',
    fullName: '2B. Hotel PMS & Accommodation (Bundled w/ Core POS)',
    tagline: 'Automatic bundle discount when paired with Core Dining & POS Engine',
    badge: 'Save ₹3,000',
    netAnnualPrice: 11999,
    monthlyEqInr: 999,
    annualPriceEur: 149,
    monthlyEqEur: 12,
    annualPriceUsd: 179,
    monthlyEqUsd: 15,
    grossInvoiceWithGst: 14159,
    underQuotaCommission30: 3600,
    overQuotaAccelerator20: 2400,
    demoFeatures: [
      'Full Hotel PMS, 50+ OTA Channel Manager & FRRO Form-C activated alongside Core Dining & POS Engine',
    ],
  },
  {
    code: 'INVENTORY_BOM_5999',
    webId: 'inventory_cogs',
    shortName: '3. Inventory, Recipe BOM & Kitchen COGS',
    fullName: '3. Inventory, Recipe BOM & Kitchen COGS',
    tagline: 'Recipe Bill of Materials, Shrinkage & Anti-Pilferage',
    badge: '~₹500/mo',
    netAnnualPrice: 5999,
    monthlyEqInr: 500,
    annualPriceEur: 69,
    monthlyEqEur: 6,
    annualPriceUsd: 89,
    monthlyEqUsd: 7,
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
    webId: 'finance_accounting',
    shortName: '4. Enterprise Finance, GST & Statutory Tax',
    fullName: '4. Enterprise Finance, GST & Statutory Tax',
    tagline: 'Cashbook Till Balancing, GSTR-1, Hotel Split-GST, TDS & Tally XML Export',
    badge: '~₹500/mo',
    netAnnualPrice: 5999,
    monthlyEqInr: 500,
    annualPriceEur: 69,
    monthlyEqEur: 6,
    annualPriceUsd: 89,
    monthlyEqUsd: 7,
    grossInvoiceWithGst: 7079,
    underQuotaCommission30: 1800,
    overQuotaAccelerator20: 1200,
    demoFeatures: [
      'Shift Till Closures & Physical Cash Drawer Balancing',
      'P&L Statements, Balance Sheets & Expense Ledger',
      'Swiggy / Zomato / ONDC Net Payout Reconciliation',
      'Statutory GST Engine: GSTR-1, GSTR-3B & 1-Click Tally Prime XML Export',
    ],
  },
  {
    code: 'STAFF_INTEL_3999',
    webId: 'staff_intelligence',
    shortName: '5. Staff Intelligence & Productivity Ops',
    fullName: '5. Staff Intelligence & Productivity Operations',
    tagline: 'Attendance Timesheets, Room Door QR Verification, Service Latency & Tip Pool',
    badge: '₹0 Per-Head Fee',
    netAnnualPrice: 3999,
    monthlyEqInr: 333,
    annualPriceEur: 49,
    monthlyEqEur: 4,
    annualPriceUsd: 59,
    monthlyEqUsd: 5,
    grossInvoiceWithGst: 4719,
    underQuotaCommission30: 1200,
    overQuotaAccelerator20: 800,
    demoFeatures: [
      'Employee Clock-in/out Timesheets & Overtime Tracking',
      'Waitstaff Service Turnaround & Order Latency Metrics',
      'Housekeeper Room Door QR Physical Presence Scan & Turnaround Speed Logs',
      'Equitable Service Charge & Tip Pool Distribution (FOH/BOH)',
    ],
  },
  {
    code: 'MULTI_PROPERTY_CRS_7999',
    webId: 'multi_property_crs',
    shortName: '6. Multi-Property CRS & Chain Head-Office (+Per Extra Outlet)',
    fullName: '6. Multi-Property CRS & Chain Head-Office (Per Extra Outlet Add-On)',
    tagline: 'Central Reservation System, 1-Click Branch Switcher & Chain Analytics',
    badge: 'Per Extra Outlet',
    netAnnualPrice: 7999,
    monthlyEqInr: 666,
    annualPriceEur: 99,
    monthlyEqEur: 8,
    annualPriceUsd: 119,
    monthlyEqUsd: 10,
    grossInvoiceWithGst: 9439,
    underQuotaCommission30: 2400,
    overQuotaAccelerator20: 1600,
    demoFeatures: [
      '1-Click Multi-Property & Multi-Outlet Context Switcher',
      'Instant New Branch Property & Outlet Provisioning',
      'Chain-Wide Live Occupancy %, ADR, RevPAR & Consolidated F&B Revenue Matrix',
    ],
  },
  {
    code: 'ALL_IN_ONE_34999',
    webId: 'all_inclusive_suite',
    shortName: 'ALL-IN-ONE SUITE (All 5 Core Modules — Save ₹4,996)',
    fullName: 'ALL-IN-ONE HOSPITALITY SUITE (All 5 Modules — Includes ₹4,996 Bundle Discount)',
    tagline: 'POS + Delivery + Hotel PMS + Inventory COGS + Finance & GST + Staff Intelligence',
    badge: 'Best Value · Save ₹4,996',
    netAnnualPrice: 34999,
    monthlyEqInr: 2917,
    annualPriceEur: 399,
    monthlyEqEur: 33,
    annualPriceUsd: 499,
    monthlyEqUsd: 42,
    grossInvoiceWithGst: 41299,
    underQuotaCommission30: 10500,
    overQuotaAccelerator20: 7000,
    demoFeatures: [
      'Complete 5-Module Hospitality Ecosystem (Includes ₹4,996 Suite Bundle Discount vs. ₹39,995 separate sum)',
    ],
  },
] as const;

const CORE_FIVE_CODES = [
  'CORE_POS_11999',
  'INVENTORY_BOM_5999',
  'FINANCE_GST_5999',
  'STAFF_INTEL_3999',
];

export function calculateModulesPricing(
  moduleCodes: string[],
  options?: {
    region?: PricingRegion;
    billingModel?: BillingModel;
    extraOutlets?: number;
  }
): {
  netAnnualRevenue: number;
  grossInvoiceWithGst: number;
  underQuotaCommission30: number;
  overQuotaAccelerator20: number;
  regionAmount: number;
  regionGrossAmount: number;
  monthlyEquivalent: number;
  currencySymbol: string;
  isAllInclusiveSuite: boolean;
  bundleSavings: number;
} {
  const regionId: PricingRegion = options?.region || 'india';
  const billingModel: BillingModel = options?.billingModel || 'annual_modular';
  const extraOutlets = Math.max(1, options?.extraOutlets || 1);
  const regionCfg =
    GOLDEN_FORK_REGIONS.find((r) => r.id === regionId) || GOLDEN_FORK_REGIONS[0];

  // Flexible Monthly Plan (₹2,999/mo | €39/mo | $49/mo)
  if (billingModel === 'monthly_2999') {
    const regionMonthly = regionCfg.monthlyFlatPrice;
    const inrAnnual = 2999 * 12;
    const inrGross = Math.round(inrAnnual * 1.18);
    return {
      netAnnualRevenue: 2999,
      grossInvoiceWithGst: Math.round(2999 * 1.18),
      underQuotaCommission30: Math.round(2999 * 0.3),
      overQuotaAccelerator20: Math.round(2999 * 0.2),
      regionAmount: regionMonthly,
      regionGrossAmount:
        regionId === 'india' ? Math.round(regionMonthly * 1.18) : regionMonthly,
      monthlyEquivalent: regionMonthly,
      currencySymbol: regionCfg.currencySymbol,
      isAllInclusiveSuite: false,
      bundleSavings: 0,
    };
  }

  // Pay-As-You-Go Plan (2% Platform Fee)
  if (billingModel === 'payg_2_percent') {
    return {
      netAnnualRevenue: 0,
      grossInvoiceWithGst: 0,
      underQuotaCommission30: 0,
      overQuotaAccelerator20: 0,
      regionAmount: 0,
      regionGrossAmount: 0,
      monthlyEquivalent: 0,
      currencySymbol: regionCfg.currencySymbol,
      isAllInclusiveSuite: false,
      bundleSavings: 0,
    };
  }

  if (!moduleCodes || moduleCodes.length === 0) {
    return {
      netAnnualRevenue: 0,
      grossInvoiceWithGst: 0,
      underQuotaCommission30: 0,
      overQuotaAccelerator20: 0,
      regionAmount: 0,
      regionGrossAmount: 0,
      monthlyEquivalent: 0,
      currencySymbol: regionCfg.currencySymbol,
      isAllInclusiveSuite: false,
      bundleSavings: 0,
    };
  }

  const uniqueCodes = Array.from(new Set(moduleCodes));
  const hasPos = uniqueCodes.includes('CORE_POS_11999');
  const hasPms =
    uniqueCodes.includes('HOTEL_PMS_14999') ||
    uniqueCodes.includes('HOTEL_PMS_BUNDLED_11999');
  const hasCrs = uniqueCodes.includes('MULTI_PROPERTY_CRS_7999');
  const hasAllFiveSeparate =
    CORE_FIVE_CODES.every((c) => uniqueCodes.includes(c)) && hasPms;
  const isAllInclusive =
    uniqueCodes.includes('ALL_IN_ONE_34999') || hasAllFiveSeparate;

  const crsMod = PT_SALES_SCHEDULE_A.find((m) => m.code === 'MULTI_PROPERTY_CRS_7999')!;
  const crsInr = hasCrs ? crsMod.netAnnualPrice * extraOutlets : 0;
  const crsRegion = hasCrs
    ? (regionId === 'india'
        ? crsMod.netAnnualPrice
        : regionId === 'europe'
        ? crsMod.annualPriceEur
        : crsMod.annualPriceUsd) * extraOutlets
    : 0;

  if (isAllInclusive) {
    const suiteMod = PT_SALES_SCHEDULE_A.find((m) => m.code === 'ALL_IN_ONE_34999')!;
    const netInr = suiteMod.netAnnualPrice + crsInr;
    const grossInr = Math.round(netInr * 1.18);
    const regionTotal = regionCfg.allInOneAnnual + crsRegion;
    return {
      netAnnualRevenue: netInr,
      grossInvoiceWithGst: grossInr,
      underQuotaCommission30: Math.round(netInr * 0.3),
      overQuotaAccelerator20: Math.round(netInr * 0.2),
      regionAmount: regionTotal,
      regionGrossAmount:
        regionId === 'india' ? Math.round(regionTotal * 1.18) : regionTotal,
      monthlyEquivalent: Math.round(regionTotal / 12),
      currencySymbol: regionCfg.currencySymbol,
      isAllInclusiveSuite: true,
      bundleSavings: regionCfg.allInOneSavings,
    };
  }

  let netInr = 0;
  let regionTotal = 0;
  let bundleSavings = 0;

  for (const code of uniqueCodes) {
    if (code === 'MULTI_PROPERTY_CRS_7999') {
      netInr += crsInr;
      regionTotal += crsRegion;
      continue;
    }
    const found = PT_SALES_SCHEDULE_A.find((m) => m.code === code);
    if (!found) continue;

    // Automatic bundle discount from thegoldenfork.de: Hotel PMS is ₹11,999 (€149 / $179) when paired with Core POS
    if (code === 'HOTEL_PMS_14999' && hasPos) {
      netInr += 11999;
      regionTotal += regionId === 'india' ? 11999 : regionId === 'europe' ? 149 : 179;
      bundleSavings += regionId === 'india' ? 3000 : regionId === 'europe' ? 30 : 40;
    } else {
      netInr += found.netAnnualPrice;
      regionTotal +=
        regionId === 'india'
          ? found.netAnnualPrice
          : regionId === 'europe'
          ? found.annualPriceEur
          : found.annualPriceUsd;
    }
  }

  const grossInr = Math.round(netInr * 1.18);

  return {
    netAnnualRevenue: netInr,
    grossInvoiceWithGst: grossInr,
    underQuotaCommission30: Math.round(netInr * 0.3),
    overQuotaAccelerator20: Math.round(netInr * 0.2),
    regionAmount: regionTotal,
    regionGrossAmount:
      regionId === 'india' ? Math.round(regionTotal * 1.18) : regionTotal,
    monthlyEquivalent: Math.round(regionTotal / 12),
    currencySymbol: regionCfg.currencySymbol,
    isAllInclusiveSuite: false,
    bundleSavings,
  };
}

export function getLeadNetAnnualRevenue(lead: {
  status?: string;
  customFields?: Record<string, any>;
}): number {
  const cf = (lead.customFields as Record<string, any>) || {};
  if (typeof cf.netAnnualRevenue === 'number' && cf.netAnnualRevenue >= 0 && cf.billingModel) {
    return cf.netAnnualRevenue;
  }
  if (typeof cf.netAnnualRevenue === 'number' && cf.netAnnualRevenue > 0) {
    return cf.netAnnualRevenue;
  }
  if (typeof cf.netAnnualRevenue === 'string' && Number(cf.netAnnualRevenue) > 0) {
    return Number(cf.netAnnualRevenue);
  }
  if (Array.isArray(cf.subscribedModules) && cf.subscribedModules.length > 0) {
    const calc = calculateModulesPricing(cf.subscribedModules, {
      region: cf.pricingRegion,
      billingModel: cf.billingModel,
      extraOutlets: cf.extraOutlets,
    });
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
      basePayout = probationFixedFee;
      willTerminate = true;
      tierStatusLabel = 'Month 1 Tier 2 — ₹6,000 Fixed Fee (Does Not Clear Probation)';
    } else {
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
      basePayout = 0;
      underQuotaCommission = Math.round(
        netRev * PT_SALES_CONSTANTS.UNDER_QUOTA_COMMISSION_RATE
      );
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

  const tdsDeduction = 0;
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
