import { Employee, Lead, SalaryReport, CustomFieldDefinition } from '@/types';
import LeadsBoard from './LeadsBoard';
import Link from 'next/link';
import { PT_SALES_CONSTANTS } from '@/lib/compensation';

type Props = {
  loggedInEmployeeId: string;
  employees: Employee[];
  leads: Lead[];
  reports: SalaryReport[];
  settings: Record<string, string>;
  customFieldDefs?: CustomFieldDefinition[];
};

export default function EmployeeView({
  loggedInEmployeeId,
  employees,
  leads,
  reports,
  customFieldDefs = [],
}: Props) {
  const myReport = reports.find((r) => r.employeeId === loggedInEmployeeId);

  const loggedInEmployee = employees.find((e) => e.id === loggedInEmployeeId);
  const isTeamLead = loggedInEmployee?.role === 'Team Lead';
  const isPartTime = Boolean(myReport?.isPartTime);

  const myLeads = leads.filter((l) => {
    if (l.employeeId === loggedInEmployeeId) return true;
    if (isTeamLead) {
      const leadOwner = employees.find((e) => e.id === l.employeeId);
      return leadOwner?.managerId === loggedInEmployeeId;
    }
    return false;
  });

  if (!myReport) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 shadow-sm">
        <p className="font-semibold">⚠️ Employee record unlinked. Please contact HR.</p>
      </div>
    );
  }

  const teamEmployees = isTeamLead
    ? employees.filter((e) => e.id === loggedInEmployeeId || e.managerId === loggedInEmployeeId)
    : loggedInEmployee
    ? [loggedInEmployee]
    : [];

  return (
    <div className="space-y-6">
      {isPartTime && (
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Part-Time Field Sales &amp; Product Demo Executive ({PT_SALES_CONSTANTS.DOCUMENT_REF})
              </span>
              <span className="text-xs text-indigo-200">
                {PT_SALES_CONSTANTS.WEEKLY_HOURS_RANGE} • {PT_SALES_CONSTANTS.FIELD_WINDOWS}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {myReport.tierStatusLabel || 'Monthly Performance Tracker Active'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] uppercase tracking-wider text-indigo-200">Net Annual Rev</p>
                <p className="text-sm font-mono font-bold">
                  ₹{(myReport.netRevenueThisMonth || 0).toLocaleString('en-IN')} / ₹60,000
                </p>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] uppercase tracking-wider text-indigo-200">Verified Demos</p>
                <p className="text-sm font-mono font-bold">
                  {myReport.verifiedDemos || 0} / {PT_SALES_CONSTANTS.MONTHLY_DEMO_QUOTA}
                </p>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] uppercase tracking-wider text-indigo-200">Est. Payout</p>
                <p className="text-sm font-mono font-bold text-emerald-400">
                  ₹{myReport.totalPayout.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <Link
              href="/earnings"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
            >
              View Schedule A &amp; Earnings →
            </Link>
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
        <h2 className="text-3xl font-serif font-black tracking-tight mb-8 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            📊
          </span>
          My Pipeline
        </h2>
        <LeadsBoard
          initialLeads={myLeads}
          employees={teamEmployees}
          isManager={isTeamLead}
          customFieldDefs={customFieldDefs}
        />
      </section>
    </div>
  );
}
