import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { getSystemSettings } from '@/lib/db/settings';
import { generateSalaryReport } from '@/lib/payroll';
import { prisma } from '@/lib/prisma';
import EmployeeDashboard from '../components/EmployeeDashboard';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  const isManager = role === 'Manager' || role === 'HR';

  const [employees, leads, settings, invoices] = await Promise.all([
      getEmployees(),
      getLeads(),
      getSystemSettings(),
      prisma.invoice.findMany()
  ]);

  const reports = generateSalaryReport(employees, leads, invoices);
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);
  const loggedInEmployee = employees.find(e => e.id === loggedInEmployeeId);

  return (
    <DashboardLayout role={role}>
      <div className="max-w-4xl mx-auto space-y-10 w-full min-w-0">
        <h1 className="text-3xl font-serif font-black tracking-tight text-gray-900 dark:text-white">
          My Earnings
        </h1>
        
        {isManager ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Team Payroll is accessed via Reports</h2>
            <p className="text-gray-500">As a manager, you can view team earnings on the Reports dashboard.</p>
          </div>
        ) : (
          <EmployeeDashboard report={myReport} settings={settings} />
        )}
      </div>
    </DashboardLayout>
  );
}
