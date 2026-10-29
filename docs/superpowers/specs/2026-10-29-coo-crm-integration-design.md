# Contractual COO Role Integration & Activity Monitoring System — Design Specification

**Document Ref Mapping:** `ME/TGF/EXEC-COO/2026-10-REV4` (Effective Date: `2026-10-29`)  
**Principal / Sole Proprietor:** Paul Marandi (`Metachasm Enterprises`, GSTIN: `09DRPPM2400H1ZQ`)  
**Contractual Executive:** Ankur Otto (`ankurotto@gmail.com`, PAN: `ABCPO5616K`, Role: `COO`)

---

## 1. Strategic Approaches Evaluated

### Approach A: Dedicated COO Operations & Governance Suite (Recommended)
Introduce a first-class `'COO'` role in the CRM with dedicated Prisma models (`CooWorkSession`, `CooWeeklyReport`, `CooVestingPause`, `MonthlySettledRevenue`, `MerchantDeployment`) and a dual-perspective interface:
1. **COO Operations Console (Ankur's View):** Real-time 5-Pillar Session Timer with auto-idle detection, Venue Onboarding & 21-Day Trial SLA tracker, Field Demo QA Auditor, Monday 10 AM Weekly Report builder, and live Vesting/Revenue-Share transparency widget.
2. **Founder COO Oversight & Buyback Command Center (Paul's View):** Real-time verification of Ankur's logged hours, session audit trail, weekly report compliance, Completed Month vesting approval/override, 60-day emergency pause control, SBI settled revenue ledger (`A/C 36048161321`), and live TTM Buyout Floor (`3.0x` / `4.0x`) & FMV calculator.

- **Pros:** 100% contractual fidelity with `ME/TGF/EXEC-COO/2026-10-REV4`; tamper-evident audit trail for Section 4.4 ("Forfeiture for Cause"); clean separation between regular salaried Sales Executives (`payroll.ts`) and pure 3% revenue-share COO compensation.
- **Cons:** Requires a Prisma migration for new tables.

### Approach B: JSON Custom-Fields & AuditLog Piggybacking
Keep `Manager` role for Ankur and store time logs and reports inside existing `AuditLog` JSON payloads and `Employee.customFields`.
- **Pros:** Zero schema migrations.
- **Cons:** Fragile querying, cannot enforce fiduciary boundaries (e.g., ₹10,000 expense approval cap vs. Founder powers), and makes 18-month graded vesting / TTM buyout calculations error-prone.

### Approach C: External Time-Tracker Webhook Integration
Use third-party time tracking and sync hours via webhook into the CRM.
- **Pros:** Offloads timer UI.
- **Cons:** Violates Section 2.3 (*"logged and tracked in real time through Metachasm Enterprises' proprietary in-house CRM platform using the Executive's assigned credentials"*).

**Selected Architecture:** **Approach A**.

---

## 2. Role Hierarchy & Fiduciary Guardrails (Section 1 & Section 7.1)

### 2.1 Account Consolidation
- **Primary Account:** `ankurotto@gmail.com` (`id: 199679c8-9099-4f66-90a5-90d2623954fa`)
  - `role`: `'COO'`
  - `startDate`: `'2026-10-29'`
  - `panNumber`: `'ABCPO5616K'`
  - `baseSalary`: `0`, `probationSalary`: `0`, `commissionRate`: `3.0` (3% Net Realized Monthly Revenue)
- **Duplicate Account:** `ankurfreelancingforfreedom@gmail.com` (`id: c74a3843-83c3-4054-8465-0f0d175bd065`)
  - Reassign any linked leads/logs to `199679c8-9099-4f66-90a5-90d2623954fa` and remove the duplicate record so all activity is unified under a single credential.

### 2.2 Permission Matrix (`COO` vs. `Manager` / Sole Proprietor)
| Capability | Sales Executive | Team Lead | HR | **COO (Ankur Otto)** | **Founder / Manager (Paul Marandi)** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View & Audit All Leads / Demo Logs | Own | Squad | Read-Only | **Full Access + QA Audit** | **Full Access** |
| Verify Lead Conversions (`/approvals`) | No | Squad | No | **Yes (With Demo QA Check)** | **Yes** |
| Approve Expenses (`/approvals`) | No | No | Yes | **Up to ₹10,000 Cap (Sec 1.3)** | **Unlimited** |
| Approve Offboarding / Terminate Staff | No | Request | Request | **Request Only** | **Final Approval** |
| Alter System Pricing / Compensation Rules | No | No | No | **Blocked (Sec 1.3)** | **Yes** |
| Manage Venue Deployments & 21-Day Trials | No | No | No | **Full Owner (Pillar 1 & 3)** | **Full Access** |
| Log COO Work Sessions & Weekly Reports | No | No | No | **Required (Sec 2.3 & 2.4)** | **Monitor & Audit** |
| Enter Monthly SBI Settled Revenue & Exercise Buyback | No | No | No | **Read & Verify (Sec 4.5)** | **Exclusive Write Access** |
| Excluded from Sales Exec Leaderboard | No | No | Yes | **Yes (Executive Role)** | **Yes** |

---

## 3. Data Architecture & Prisma Schema Extensions

We will add four focused models to `prisma/schema.prisma`:

### 3.1 `CooWorkSession` (Real-Time Work & Pillar Tracking — Section 2.2, 2.3, 3.1–3.5)
Tracks every active working block logged by the COO with automatic idle-pause protection.
- `id`: `String @id @default(uuid())`
- `employeeId`: `String` (Ankur Otto's ID)
- `pillar`: `String` — Enum-like string:
  - `'PILLAR_1_ONBOARDING'` (Merchant Onboarding & Module Setup)
  - `'PILLAR_2_FIELD_GOV'` (Field Governance, Demo QA & Territory Logistics)
  - `'PILLAR_3_RETENTION'` (21-Day Free Trial Monitoring, Support & Zero-Churn)
  - `'PILLAR_4_B2B_DELIVERY'` (B2B Web/Software Delivery & SAC 998311 Compliance)
  - `'PILLAR_5_ALIGNMENT'` (Product-Ops Feedback & Founder/CEO Sync)
- `taskTitle`: `String` (Specific task or merchant worked on)
- `notes`: `String @db.Text` (Deliverables/outcomes achieved during session)
- `startedAt`: `DateTime @default(now())`
- `lastHeartbeatAt`: `DateTime @default(now())`
- `endedAt`: `DateTime?`
- `durationMinutes`: `Int @default(0)` (Calculated active minutes)
- `status`: `String @default("ACTIVE")` (`"ACTIVE"` | `"COMPLETED"` | `"AUTO_PAUSED_IDLE"` | `"FLAGGED_BY_FOUNDER"`)
- `relatedLeadId`: `String?` (Optional link to a specific merchant/lead)
- `verifiedByFounder`: `Boolean @default(true)`

### 3.2 `CooWeeklyReport` (Mandatory Monday 10:00 AM IST Reports — Section 2.4)
- `id`: `String @id @default(uuid())`
- `employeeId`: `String`
- `weekStartDate`: `String` (ISO Monday `YYYY-MM-DD`)
- `weekEndDate`: `String` (ISO Sunday `YYYY-MM-DD`)
- `deadlineAt`: `DateTime` (Following Monday at `10:00:00+05:30`)
- `submittedAt`: `DateTime @default(now())`
- `isOnTime`: `Boolean` (`submittedAt <= deadlineAt`)
- `totalHoursLogged`: `Float` (Auto-aggregated from `CooWorkSession` for that week)
- `venuesOnboardedCount`: `Int`
- `activeTrialsMonitoredCount`: `Int`
- `fieldDemosVerifiedCount`: `Int`
- `b2bMilestonesDelivered`: `String @db.Text`
- `merchantEscalationsResolved`: `String @db.Text`
- `nextWeekPriorities`: `String @db.Text`
- `founderAcknowledged`: `Boolean @default(false)`
- `founderNotes`: `String? @db.Text`

### 3.3 `CooMonthlyLedger` (Net Realized Revenue, Completed Month & Vesting — Section 4 & 5)
Tracks each calendar month (`YYYY-MM`) from `2026-10` onward:
- `id`: `String @id @default(uuid())`
- `month`: `String @unique` (`"2026-11"`, etc.)
- `hoursLogged`: `Float @default(0)`
- `weeklyReportsSubmitted`: `Int @default(0)`
- `weeklyReportsRequired`: `Int @default(4)`
- `qualifiesAsCompletedMonth`: `Boolean @default(false)` (Auto-true if `hoursLogged >= 60` and all weekly reports submitted, or Founder override)
- `isEmergencyPause`: `Boolean @default(false)` (Section 4.2.4 — up to 60 days pause before 6 months)
- `pauseReason`: `String?`
- `grossSettledInSbi`: `Float @default(0)` (Total customer credits settled in SBI A/C `36048161321`)
- `gstExcluded`: `Float @default(0)` (18% GST/IGST excluded)
- `gatewayAndRefundDeductions`: `Float @default(0)`
- `netRealizedRevenue`: `Float @default(0)` (Pre-tax net settled revenue)
- `cooActiveSharePercent`: `Float @default(3.0)` (3.00% while active)
- `grossCooPayout`: `Float @default(0)` (`netRealizedRevenue * 0.03`)
- `tdsDeducted`: `Float @default(0)`
- `netCooPayout`: `Float @default(0)`
- `disbursementStatus`: `String @default("PENDING")` (`"PENDING"` | `"STATEMENT_ISSUED"` | `"PAID"` | `"FORFEITED"`)
- `statementUrl`: `String?`
- `settledAt`: `DateTime?`

### 3.4 `MerchantDeployment` (Pillar 1, 2 & 3 Operational Tracker — Section 3.1–3.3)
Tracks hospitality venues from trial/conversion through modular setup and quarterly health checks:
- `id`: `String @id @default(uuid())`
- `leadId`: `String?`
- `venueName`: `String`
- `venueType`: `String` (`"Restaurant"` | `"Cafe"` | `"Cloud Kitchen"` | `"Hotel"` | `"Lounge"`)
- `onboardingStatus`: `String` (`"TRIAL_21_DAY"` | `"MODULE_SETUP"` | `"LIVE_ACTIVE"` | `"AT_RISK"` | `"CHURNED"`)
- `trialStartDate`: `String?`
- `trialEndsAt`: `String?`
- `subscribedModules`: `Json` (Array of enabled modules: `CORE_POS_11999`, `HOTEL_PMS_14999`, `INVENTORY_BOM_5999`, `FINANCE_GST_5999`, `STAFF_INTEL_3999`, `ALL_IN_ONE_34999`)
- `annualContractValue`: `Float @default(0)`
- `demoVerifiedByCoo`: `Boolean @default(false)`
- `slaGoLiveDate`: `String?`
- `lastHealthAuditDate`: `String?`
- `notes`: `String? @db.Text`
- `updatedAt`: `DateTime @updatedAt`

---

## 4. Activity Monitoring & Anti-Idle Engine (Section 2.3 & Section 4.4)

To ensure all logged hours are genuine and auditable:
1. **Active Session Timer Bar (Top Header / COO Console):**
   - When Ankur starts work, he selects one of the **5 Operational Pillars**, enters the task/merchant name, and clicks **Start Session**.
   - While a session is `ACTIVE`, the client sends a heartbeat every **2 minutes** to `/api/coo/session/heartbeat` ONLY if user interaction (mouse, keyboard, click, or scroll) occurred within the last **15 minutes**.
   - If no interaction occurs for 15 minutes, the session is automatically paused (`AUTO_PAUSED_IDLE`) and capped at `lastHeartbeatAt`, preventing "open-tab time inflation" (Section 4.4 falsification protection).
2. **Weekly & Monthly Hour Progress Bars:**
   - **Weekly Target:** `15.0 hrs/week` minimum (Green at ≥15h, Amber at 10–14.9h, Red if <15h by Sunday midnight).
   - **Monthly Target:** `60.0 hrs/month` minimum qualification threshold for a **Completed Month**, with an `80.0 hrs/month` stretch indicator (reconciling Section 2.2 and Section 2.3).
   - **2-Week Consecutive Failure Alert (Section 4.4):** If two consecutive weeks fall below 15 hours or miss the Monday 10:00 AM IST report without Founder approval, the Founder dashboard displays a **Cure Notice Alert** badge.

---

## 5. Vesting, Revenue-Share & Buyback Engine (`src/lib/cooCompensation.ts`)

Pure, deterministic TypeScript module implementing Sections 4 and 5 of the Agreement:
1. **Completed Months Counter:** Counts months where `qualifiesAsCompletedMonth === true`.
2. **Graded Vesting Tier Calculation (Section 4.2.2):**
   - `< 6 Completed Months`: `0%` of grant (`0.00%` surviving revenue share)
   - `6–11 Completed Months`: `25%` of grant (`0.75%` surviving revenue share; or `(Completed Months / 18) * 3.00%` if terminated without Cause post-6 months per Section 4.2.3)
   - `12–17 Completed Months`: `50%` of grant (`1.50%` surviving revenue share; or pro-rata on termination without Cause)
   - `≥ 18 Completed Months`: `100%` of grant (`3.00%` surviving revenue share)
3. **24-Month Lock-In & Buyback Valuation Calculator (Section 5.1 & 5.2):**
   - Tracks lock-in expiry (`2028-10-29`, 24 calendar months from `2026-10-29`).
   - Computes **TTM Realized Payouts** (sum of `netCooPayout` + `tdsDeducted` over the trailing 12 months).
   - Computes **TTM Multiple Floor**:
     - `3.0x TTM Realized Payouts` (for 6–17 Completed Months)
     - `4.0x TTM Realized Payouts` (for ≥18 Completed Months)
   - Computes **FMV Share**: `(Vested Revenue-Share %) × (Entered Company FMV)`.
   - Outputs **Binding Buyback Price**: `Math.max(fmvShare, ttmMultipleFloor)`.

---

## 6. User Interfaces

1. **`/coo` — COO Operations & Governance Hub:**
   - **For Ankur Otto (`COO`):**
     - **Tab 1: Live Session Timer & 5-Pillar Work Log** (Start/Stop timer, pillar breakdown chart, weekly 15h & monthly 60h/80h gauges).
     - **Tab 2: Merchant Onboarding & 21-Day Trial SLA Board** (Track venue deployments, configure Golden Fork modules, monitor trial expiry countdowns).
     - **Tab 3: Field Demo QA & Visit Verification** (Audit Sales Executive leads/demos and stamp `"Verified by COO"`).
     - **Tab 4: Mandatory Weekly Activity Reports** (One-click auto-population of hours/metrics + narrative inputs for B2B milestones, escalations, and priorities; countdown to Monday 10:00 AM IST).
     - **Tab 5: My Agreement, Vesting Clock & Settled Revenue Statements** (Live 18-month vesting progress bar, monthly 3% revenue statements, and contractual guardrails summary).
   - **For Paul Marandi (`Manager` / Sole Proprietor):**
     - Full visibility into all 5 tabs above, PLUS **Founder Controls**:
       - Audit/flag suspicious work sessions, approve/override "Completed Month" status, trigger 60-day Emergency Vesting Pause, record monthly SBI settled revenue & deductions (`A/C 36048161321`), and simulate/issue a Buyback Notice with live TTM vs. FMV calculations.
2. **Manager Dashboard Widget (`ManagerDashboard.tsx`):**
   - A compact **COO Activity & SLA Monitor Card** on the main dashboard showing Ankur's current status (Online / Active Pillar Session), this week's hours (`X / 15 hrs`), Monday Report status (`Submitted On Time` / `Due` / `Overdue`), and Completed Months vested (`X / 18`).
