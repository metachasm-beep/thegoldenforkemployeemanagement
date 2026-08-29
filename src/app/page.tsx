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

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  const isManager = role === 'Manager';

  const [employees, leads, settings] = await Promise.all([
    getEmployees(),
    getLeads(),
    getSystemSettings(),
  ]);

  const reports = generateSalaryReport(employees, leads);

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isManager ? (
          <ManagerView employees={employees} leads={leads} reports={reports} />
        ) : (
          <EmployeeView
            loggedInEmployeeId={loggedInEmployeeId}
            employees={employees}
            leads={leads}
            reports={reports}
            settings={settings}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
