import { Employee, Lead, SalaryReport, AuditLog, CustomFieldDefinition } from '@/types';
import { HiringRecord } from '@/lib/hiringMetrics';
import LazyManagerDashboard from './LazyManagerDashboard';
import LeadsBoard from './LeadsBoard';
import PayrollTable from './PayrollTable';
import { PT_SALES_CONSTANTS } from '@/lib/compensation';

type Props = {
  employees: Employee[];
  leads: Lead[];
  reports: SalaryReport[];
  auditLogs: AuditLog[];
  hiringRecords?: HiringRecord[];
  customFieldDefs?: CustomFieldDefinition[];
};

export default function ManagerView({
  employees,
  leads,
  reports,
  auditLogs,
  hiringRecords = [],
  customFieldDefs = [],
  isHR = false,
}: Props & { isHR?: boolean }) {
  return (
    <div className="space-y-8 w-full min-w-0">
      <LazyManagerDashboard
        employees={employees}
        leads={leads}
        auditLogs={auditLogs}
        hiringRecords={hiringRecords}
        isHR={isHR}
      />

      {/* Payout & Probation Rules — Full-Time & Part-Time Field Sales */}
      <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-balance">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              📜
            </span>
            Payout &amp; Probation Rules (Full-Time &amp; Part-Time Field Sales)
          </h2>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Part-Time Ref: {PT_SALES_CONSTANTS.DOCUMENT_REF}
          </span>
        </div>

        {/* Full-Time Sales Executive Rules */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
            A. Full-Time Sales Executive Compensation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Month 1 (Probation)</h4>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ≥ 2 Sales:
                  </span>{' '}
                  ₹15,000 Base Salary
                </li>
                <li>
                  <span className="font-semibold text-red-600 dark:text-red-400">&lt; 2 Sales:</span>{' '}
                  ₹0 Base + Termination Risk
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Month 2+ (Standard)</h4>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ≥ 5 Sales:
                  </span>{' '}
                  ₹45,000 Base Salary
                </li>
                <li>
                  <span className="font-semibold text-amber-600 dark:text-amber-500">
                    &lt; 5 Sales:
                  </span>{' '}
                  ₹9,000 per Sale
                  <br />
                  <span className="text-xs text-gray-500">
                    (Triggers auto-relegation to Month 1 rules)
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Bonuses &amp; Milestones
              </h4>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Performance:
                  </span>{' '}
                  ₹5,000 per sale over quota (5)
                </li>
                <li>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Milestone:
                  </span>{' '}
                  ₹1,00,000 every 100 cumulative sales
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Part-Time Field Sales & Product Demonstration Executive Rules */}
        <div className="pt-4 border-t border-gray-200/70 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
            B. Part-Time Field Sales &amp; Product Demonstration Executive ({PT_SALES_CONSTANTS.DOCUMENT_REF})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Month 1 Probation (3 Tiers)
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  <span className="font-semibold text-green-600 dark:text-green-400">Tier 1:</span>{' '}
                  ≥ ₹59,950 Net Rev + ≥ 15 Verified Demos → <strong>₹6,000 Fixed Fee</strong> (+20%
                  accel &gt; ₹60k) &amp; Clears Probation
                </li>
                <li>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Tier 2:</span>{' '}
                  ₹23,990–₹59,949 Net Rev + ≥ 15 Demos → <strong>₹6,000 Fixed Fee</strong>{' '}
                  (Terminates at end of Month 1)
                </li>
                <li>
                  <span className="font-semibold text-red-600 dark:text-red-400">Tier 3:</span> &lt;
                  ₹23,990 Net Rev OR &lt; 15 Demos → <strong>₹0 Forfeited</strong> &amp; Termination
                </li>
              </ul>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Month 2+ Standard Part-Time
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Quota Met (≥ ₹59,950 + 15 Demos):
                  </span>{' '}
                  <strong>₹18,000 Fixed Base</strong>
                </li>
                <li>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Under Quota (&lt; ₹59,950):
                  </span>{' '}
                  ₹18k base void; paid <strong>30% of Net Annual Revenue</strong> (e.g. ₹3,600/POS,
                  ₹4,500/PMS, ₹10,500/Suite) + Secondary Probation
                </li>
              </ul>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Accelerator, Upsells &amp; Milestones
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Over-Quota Accelerator:
                  </span>{' '}
                  <strong>20% uncapped bonus</strong> on Net Annual Revenue above ₹60,000/mo
                </li>
                <li>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Cumulative Milestone:
                  </span>{' '}
                  <strong>₹60,000 bonus</strong> per ₹12,00,000 cumulative settled Net Revenue
                </li>
                <li>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    90-Day Upsell Window:
                  </span>{' '}
                  100% credit on module upgrades within 90 days of initial settlement
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Closer Compensation Rules */}
        <div className="pt-4 border-t border-gray-200/70 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            C. Closer (Deal Closing Specialist — COO Monitored)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                2-Month Probation &amp; Base Salary
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Months 1–2 (Probation):
                  </span>{' '}
                  <strong>₹30,000 / month</strong> fixed base
                </li>
                <li>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Month 3+ (Post-Probation):
                  </span>{' '}
                  <strong>₹60,000 / month</strong> fixed base
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                10% Sales Incentive &amp; Full Credit
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Closing Incentive:
                  </span>{' '}
                  <strong>10% of closed sales</strong> (settled Net Annual Revenue)
                </li>
                <li>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Conversion Attribution:
                  </span>{' '}
                  Closer receives <strong>100% conversion credit</strong> even on leads generated by
                  active Sales Executives
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Daily 10-Lead Queue &amp; EOD Governance
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs">
                <li>
                  No cold lead generation — COO/Manager dispatches <strong>10 fresh leads/day</strong>
                </li>
                <li>
                  <strong>Follow-Up / Proposal Sent</strong> leads stay in Carry-Over tab separately
                  from tomorrow&apos;s fresh 10
                </li>
                <li>
                  Mandatory EOD report due <strong>9:00 PM IST</strong> (unworked count flagged to
                  COO)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 text-sm">
          <span className="font-bold">⚠️ Settlement &amp; 18% GST Exclusion Rule:</span> Only{' '}
          <strong className="font-bold underline">settled annual subscriptions</strong> cleared into
          the official bank account of Metachasm Enterprises count toward revenue quotas and
          commissions (calculated strictly on Net Annual Fee excluding 18% GST). Enrolling a venue
          in a 14-Day Free Trial counts toward the 15-demo gate (subject to CRM verification) but
          generates ₹0 revenue credit until converted to a paid annual subscription.
        </div>
      </section>

      {!isHR && (
        <section className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-3xl font-serif font-black tracking-tight mb-8 text-gray-800 dark:text-gray-100 text-balance">
            Active Pipeline
          </h2>
          <LeadsBoard
            initialLeads={leads}
            employees={employees}
            isManager={true}
            customFieldDefs={customFieldDefs}
          />
        </section>
      )}

      <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
        <PayrollTable reports={reports} />
      </section>
    </div>
  );
}
