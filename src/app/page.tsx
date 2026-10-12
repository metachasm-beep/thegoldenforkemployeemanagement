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
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  const isManager = role === 'Manager' || role === 'HR';
  const isHR = role === 'HR';

  const [employees, leads, settings, auditLogsRes, invoicesRes, customFields] = await Promise.all([
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
    getCustomFieldDefinitions('LEAD')
  ]);

  const auditLogs = auditLogsRes.data;
  const invoices = invoicesRes.data;
  const dbErrorNotice = auditLogsRes.error || invoicesRes.error;

  const reports = generateSalaryReport(employees, leads, invoices);

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto space-y-10 w-full min-w-0">
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
