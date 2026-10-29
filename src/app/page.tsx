import DashboardLayout from './components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { getSystemSettings } from '@/lib/db/settings';
import { generateSalaryReport } from '@/lib/payroll';
import ManagerView from './components/ManagerView';
import EmployeeView from './components/EmployeeView';
import { prisma } from '@/lib/prisma';
import { getCustomFieldDefinitions } from '@/services/customFieldService';
import { AlertCircle, ShieldCheck, Clock, Building2, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { COO_CONTRACT_CONSTANTS, calculateCooVesting } from '@/lib/cooCompensation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  const isManager = role === 'Manager' || role === 'COO' || role === 'HR';
  const canViewCoo = role === 'Manager' || role === 'COO';
  const isHR = role === 'HR';

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const [employees, leads, settings, auditLogsRes, invoicesRes, customFields, cooSessions, cooMonthlyLedgers, activeDeploymentsCount] = await Promise.all([
    getEmployees(),
    getLeads(),
    getSystemSettings(),
    prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 20 })
      .then(data => ({ data, error: null as string | null }))
      .catch(err => {
        console.error("Failed to load audit logs:", err);
        return { data: [], error: (err?.message as string) || 'Database connection error' };
      }),
    prisma.invoice.findMany()
      .then(data => ({ data, error: null as string | null }))
      .catch(err => {
        console.error("Failed to load invoices:", err);
        return { data: [], error: (err?.message as string) || 'Database connection error' };
      }),
    getCustomFieldDefinitions('LEAD'),
    canViewCoo
      ? prisma.cooWorkSession.findMany({ orderBy: { startedAt: 'desc' }, take: 60 }).catch(() => [])
      : Promise.resolve([]),
    canViewCoo
      ? prisma.cooMonthlyLedger.findMany({ orderBy: { month: 'desc' }, take: 24 }).catch(() => [])
      : Promise.resolve([]),
    canViewCoo
      ? prisma.merchantDeployment.count().catch(() => 0)
      : Promise.resolve(0),
  ]);

  const auditLogs = auditLogsRes.data;
  const invoices = invoicesRes.data;
  const dbErrorNotice = auditLogsRes.error || invoicesRes.error;

  const reports = generateSalaryReport(employees, leads, invoices);

  // COO Live Governance Metrics for Founder / COO Banner
  const activeCooSession = cooSessions.find(s => s.status === 'ACTIVE');
  const currentMonthMinutes = cooSessions
    .filter(s => new Date(s.startedAt).toISOString().startsWith(currentMonthPrefix))
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const currentMonthHours = Math.round((currentMonthMinutes / 60) * 10) / 10;
  const completedVestingMonths = cooMonthlyLedgers.filter(l => l.qualifiesAsCompletedMonth).length;
  const vestingState = calculateCooVesting({ completedMonths: completedVestingMonths });

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
        {dbErrorNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-sm" role="alert">
            <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm space-y-1">
              <p className="font-bold">Database Notice: {dbErrorNotice.includes('quota') ? 'Quota Exceeded' : 'Connection Issue'}</p>
              <p className="text-xs opacity-90">{dbErrorNotice}</p>
              {dbErrorNotice.includes('quota') && (
                <p className="text-xs text-amber-700 dark:text-amber-300 pt-1">
                  The Neon PostgreSQL database has exceeded its compute quota. Please upgrade or reset compute in the Neon console.
                </p>
              )}
            </div>
          </div>
        )}

        {(role === 'Manager' || role === 'COO') && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <ShieldCheck size={14} /> {COO_CONTRACT_CONSTANTS.DOCUMENT_REF}
                </span>
                {activeCooSession ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse">
                    ● COO Active Session ({activeCooSession.pillar.replace('PILLAR_', 'P')})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    COO Timer Idle
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Contractual COO Governance &amp; Revenue-Share Console ({COO_CONTRACT_CONSTANTS.EXECUTIVE_NAME})
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Real-time 5-Pillar work-session monitoring, Monday 10:00 AM IST weekly reports, 21-day merchant trial conversions, and 18-month graded vesting ledger.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                    <Clock size={11} /> Month Hrs
                  </div>
                  <div className="text-sm font-bold tabular-nums mt-0.5">
                    {currentMonthHours} / 60h
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                    <Building2 size={11} /> Deployments
                  </div>
                  <div className="text-sm font-bold tabular-nums mt-0.5">
                    {activeDeploymentsCount}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                    <Award size={11} /> Vested Share
                  </div>
                  <div className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">
                    {vestingState.survivingRevenueSharePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              <Link
                href="/coo"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors shadow-md shrink-0"
              >
                Open COO Console <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {isManager ? (
          <ManagerView employees={employees} leads={leads} reports={reports} auditLogs={auditLogs} isHR={isHR} customFieldDefs={customFields} />
        ) : (
          <EmployeeView
            loggedInEmployeeId={loggedInEmployeeId}
            employees={employees}
            leads={leads}
            reports={reports}
            settings={settings}
            customFieldDefs={customFields}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
