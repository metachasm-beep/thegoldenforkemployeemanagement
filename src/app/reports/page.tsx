import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { getExpenses } from '@/lib/db/approvals';
import { generateSalaryReport } from '@/lib/payroll';
import ReportBuilder from './ReportBuilder';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/');
  const role = (session.user as any).role;

  if (role !== 'Manager') {
    redirect('/');
  }

  const [employees, leads, expenses] = await Promise.all([
    getEmployees(),
    getLeads(),
    getExpenses()
  ]);

  const reports = generateSalaryReport(employees, leads);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Report Builder</h1>
          <p className="text-gray-500 mt-2">Generate and export filtered data from across the platform.</p>
        </div>

        <ReportBuilder 
          employees={employees}
          leads={leads}
          expenses={expenses}
          reports={reports}
        />
      </div>
    </DashboardLayout>
  );
}
