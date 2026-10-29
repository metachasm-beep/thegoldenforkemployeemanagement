# Contractual COO CRM Integration & Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Contractual Chief Operating Officer (`COO`) role for Ankur Otto into the CRM (`ME/TGF/EXEC-COO/2026-10-REV4`) with fiduciary RBAC guardrails (₹10,000 expense cap), a hybrid 5-Pillar work-session timer with 15-minute auto-idle detection, a Monday 10:00 AM IST weekly report engine, a venue onboarding/21-day trial tracker, and an 18-month graded vesting, 3% net settled revenue & TTM/FMV buyback command center.

**Architecture:** We extend the Prisma PostgreSQL schema with four focused models (`CooWorkSession`, `CooWeeklyReport`, `CooMonthlyLedger`, `MerchantDeployment`), build a pure deterministic financial/vesting calculation engine (`src/lib/cooCompensation.ts`) tested via Vitest, expose secure server actions (`src/services/cooService.ts`) and a heartbeat route (`src/app/api/coo/heartbeat/route.ts`), and deliver a unified `/coo` Operations & Governance Hub alongside a Founder oversight widget on the Manager Dashboard.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Prisma 7 (`@prisma/adapter-pg`), NextAuth, Tailwind CSS, Lucide React, Vitest.

---

### Task 1: Pure COO Compensation, Graded Vesting & Buyback Engine (TDD)

**Files:**
- Create: `src/lib/cooCompensation.ts`
- Test: `src/lib/__tests__/cooCompensation.test.ts`

- [ ] **Step 1: Write the failing Vitest unit tests for COO vesting, revenue share, and buyback calculations**

```typescript
// src/lib/__tests__/cooCompensation.test.ts
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
```

- [ ] **Step 2: Implement `src/lib/cooCompensation.ts` and run Vitest to verify all tests pass**

---

### Task 2: Prisma Schema Extension & Account Consolidation for Ankur Otto

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `CooWorkSession`, `CooWeeklyReport`, `CooMonthlyLedger`, and `MerchantDeployment` models to `prisma/schema.prisma`**
- [ ] **Step 2: Push schema with `npx prisma db push` and regenerate Prisma Client (`npx prisma generate`)**
- [ ] **Step 3: Consolidate Ankur Otto's Employee record (`ankurotto@gmail.com` -> `role: 'COO'`, `startDate: '2026-10-29'`, `panNumber: 'ABCPO5616K'`, `baseSalary: 0`, `commissionRate: 3.0`) and merge/delete duplicate `ankurfreelancingforfreedom@gmail.com`**

---

### Task 3: Fiduciary RBAC Guardrails & Server Services (`cooService.ts`)

**Files:**
- Modify: `src/services/core.ts`
- Modify: `src/services/financeService.ts`
- Modify: `src/app/approvals/page.tsx`
- Modify: `src/app/leaderboard/page.tsx`
- Modify: `src/app/components/ManagerDashboard.tsx`
- Create: `src/services/cooService.ts`
- Create: `src/app/api/coo/heartbeat/route.ts`

- [ ] **Step 1: Enforce ₹10,000 Expense Approval Cap for `COO` in `src/services/financeService.ts` and `src/app/approvals/page.tsx` (Section 1.3)**
- [ ] **Step 2: Exclude `COO` from Sales Executive Leaderboard in `src/app/leaderboard/page.tsx` and `src/app/components/ManagerDashboard.tsx`**
- [ ] **Step 3: Create `src/services/cooService.ts` with actions for starting/stopping 5-Pillar work sessions, logging Monday 10:00 AM IST weekly reports, managing venue deployments & 21-day trials, verifying field demos, and recording Founder monthly settled revenue & vesting overrides**
- [ ] **Step 4: Create `/api/coo/heartbeat/route.ts` with 15-minute auto-idle session pause enforcement**

---

### Task 4: COO Operations & Founder Governance Hub UI (`/coo` & Navigation)

**Files:**
- Create: `src/app/coo/page.tsx`
- Create: `src/app/components/CooOperationsClient.tsx`
- Modify: `src/app/components/DashboardLayout.tsx`
- Modify: `src/app/components/JobDescriptionWidget.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build `src/app/components/CooOperationsClient.tsx` featuring the 5-Pillar Session Timer with auto-idle detector, Venue Onboarding & 21-Day Trial SLA board, Field Demo QA Verifier, Monday 10 AM IST Weekly Report engine, and 18-Month Graded Vesting / 3% Settled Revenue / Buyback Calculator**
- [ ] **Step 2: Create `src/app/coo/page.tsx` and update `src/app/page.tsx` so `COO` lands directly on the COO Operations Console and `Manager` (Paul Marandi) sees a live COO Oversight Banner & Command link**
- [ ] **Step 3: Update `DashboardLayout.tsx` and `JobDescriptionWidget.tsx` with the `COO` navigation link and 5-Pillar Contractual Mandate summary**
- [ ] **Step 4: Run `npm test` and `npm run build` to verify zero TypeScript or build errors, then commit**
