import { Info } from 'lucide-react';

export default function JobDescriptionWidget({ role }: { role: string }) {
  if (role === 'Part-Time Sales Executive') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Info size={12} />
          </span>
          Role: Part-Time Field Sales Executive
        </h3>
        <p className="leading-relaxed">
          Mandate under Agreement <strong>ME/TGF/PT-SALES/2026</strong>: Direct field outreach, live
          interactive demonstrations of The Golden Fork modular suite, and annual subscription
          acquisition (20–24 hrs/wk across 6 days, 10:30 AM–12:30 PM &amp; 3:00 PM–6:00 PM).
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Monthly Baseline Quotas:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Demo Gate:</strong> Min 15 verified live on-site demonstrations per month logged
            in CRM.
          </li>
          <li>
            <strong>Revenue Quota:</strong> Min ₹60,000 (settled ≥ ₹59,950 Excl. 18% GST) in Net
            Annual Subscription Revenue.
          </li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Compensation &amp; Bonuses:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Month 1 Probation:</strong> ₹6,000 Fixed Fee (Tier 1 ≥ ₹59,950 + 15 demos clears
            probation; Tier 2 ₹23,990–₹59,949 + 15 demos pays ₹6k; Tier 3 &lt; ₹23,990 or &lt; 15
            demos forfeits).
          </li>
          <li>
            <strong>Month 2+ Standard:</strong> ₹18,000 Base (when ≥ ₹59,950 + 15 demos met) or 30%
            pro-rata Net Revenue commission under quota.
          </li>
          <li>
            <strong>Accelerator &amp; Milestone:</strong> 20% uncapped bonus above ₹60k/mo + ₹60,000
            bonus per ₹12,00,000 cumulative Net Revenue + 90-day module upsell attribution.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'Sales Executive') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Info size={12} />
          </span>
          Role: Sales Executive
        </h3>
        <p className="leading-relaxed">
          Generate revenue through consistent outreach and effectively matching solutions to client
          needs, culminating in annual subscription purchases via the product portal.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Key Responsibilities:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Pipeline:</strong> Log all interactions, no lead &quot;Pending&quot; &gt; 48h.
          </li>
          <li>
            <strong>Outreach:</strong> High daily volume outbound.
          </li>
          <li>
            <strong>Closing:</strong> Annual subscriptions only.
          </li>
          <li>
            <strong>Hygiene:</strong> Min 50-char notes for lost/pending leads.
          </li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Expectations:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Target:</strong> 5 sales in a month for full ₹45,000 base.
          </li>
          <li>
            <strong>Missed Target:</strong> &lt; 5 but &gt;= 2 pays prorated, triggers Probation.
          </li>
          <li>
            <strong>Carry-Over Goal:</strong> Missed sales added to standard target in Probation.
          </li>
          <li>
            <strong>Probation Review:</strong> Miss total target = separation.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'Team Lead') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Info size={12} />
          </span>
          Role: Team Lead
        </h3>
        <p className="leading-relaxed">
          Top-performing individual contributor and a dedicated mentor leading by example.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Key Responsibilities:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Direct Sales:</strong> Fulfill Sales Exec targets.
          </li>
          <li>
            <strong>Squad Support:</strong> Monitor daily pipeline, encourage CRM best practices.
          </li>
          <li>
            <strong>Mentorship:</strong> Weekly reviews, shadow calls/demos.
          </li>
          <li>
            <strong>Admin Support:</strong> Review PTO/expenses promptly.
          </li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Metrics &amp; Incentives:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>Evaluated on personal close rate (Sales Exec rules).</li>
          <li>
            <strong>Leadership Incentive:</strong> ₹1,000 bonus per annual subscription closed by
            squad.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'Manager') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Info size={12} />
          </span>
          Role: Manager
        </h3>
        <p className="leading-relaxed">
          Oversee operational health and success of the sales organization.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Key Responsibilities:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Strategic Analytics:</strong> Monitor company-wide metrics and ROI.
          </li>
          <li>
            <strong>Team Optimization:</strong> Manage onboarding/offboarding, reassign leads.
          </li>
          <li>
            <strong>Financial Verification:</strong> Audit and verify payments on product portal.
          </li>
          <li>
            <strong>System/Payroll Admin:</strong> Broadcast announcements, audit Master Payroll
            Ledger.
          </li>
          <li>
            <strong>Quality Assurance:</strong> Review team workflows and pipeline notes.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'COO') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Info size={12} />
          </span>
          Role: Chief Operating Officer
        </h3>
        <p className="leading-relaxed">
          Mandate under Agreement <strong>ME/TGF/EXEC-COO/2026-10-REV4</strong>: End-to-end
          commercial operations, merchant onboarding, and field governance for The Golden Fork.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          5 Operational Pillars:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Onboarding:</strong> 21-day free trial &amp; menu/KOT/PMS setup.
          </li>
          <li>
            <strong>Field Governance:</strong> Daily CRM hygiene &amp; demo verification.
          </li>
          <li>
            <strong>Retention:</strong> Churn prevention &amp; annual renewals.
          </li>
          <li>
            <strong>B2B Delivery:</strong> Multi-branch &amp; hotel PMS rollouts.
          </li>
          <li>
            <strong>Founder Alignment:</strong> Monday 10 AM IST report.
          </li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          SLA &amp; Vesting Guardrails:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Work SLA:</strong> Min 15 hrs/wk &amp; 60–80 hrs/mo logged in CRM.
          </li>
          <li>
            <strong>CapEx Limit:</strong> Expense approval capped at ₹10,000.
          </li>
          <li>
            <strong>Vesting:</strong> 3.00% Net Realized Revenue over 18 months (6m: 0.75%, 12m:
            1.50%, 18m: 3.00%) subject to 10% TDS.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'Closer') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Info size={12} />
          </span>
          Role: Closer (Deal Closing Specialist)
        </h3>
        <p className="leading-relaxed">
          Dedicated deal closer — no cold lead generation. Works 10 fresh leads handed daily by
          the COO and converts qualified prospects into annual subscriptions.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Daily Operating Cadence:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Daily Queue:</strong> 10 fresh leads dispatched daily by COO/Management.
          </li>
          <li>
            <strong>Carry-Over Pipeline:</strong> Leads marked Follow-Up or Proposal Sent stay in
            your Carry-Over tab alongside tomorrow&apos;s fresh 10.
          </li>
          <li>
            <strong>EOD Report:</strong> Mandatory daily report submitted by{' '}
            <strong>9:00 PM IST</strong> (reviewed by COO).
          </li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Compensation &amp; Credit:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Probation (2 Months):</strong> ₹30,000 / month fixed base.
          </li>
          <li>
            <strong>Post-Probation (Month 3+):</strong> ₹60,000 / month fixed base.
          </li>
          <li>
            <strong>Closing Incentive:</strong> <strong>10%</strong> of settled closed sales (Net
            Annual Revenue) with full conversion credit.
          </li>
        </ul>
      </div>
    );
  }

  if (role === 'HR') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Info size={12} />
          </span>
          Role: Human Resources (HR)
        </h3>
        <p className="leading-relaxed">
          Drive rapid sales &amp; field team expansion, onboarding, documentation hygiene, and
          retention for The Golden Fork.
        </p>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">
          Hiring Aim &amp; Cadence:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Monthly Hiring Aim:</strong> <strong>30 hirings / month</strong> (~7/week,
            ~1/day pace).
          </li>
          <li>
            <strong>Annualized Goal:</strong> 360 hirings / year across full-time &amp; part-time
            field sales cohorts.
          </li>
          <li>
            <strong>Onboarding Hygiene:</strong> Capture email, phone number, role, and reporting
            manager on day 1 in Team Directory.
          </li>
        </ul>
      </div>
    );
  }

  return null;
}
