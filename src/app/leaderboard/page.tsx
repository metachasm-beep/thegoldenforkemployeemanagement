import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { getSystemSettings } from '@/lib/db/settings';
import { generateSalaryReport } from '@/lib/payroll';
import LeaderboardWidget from '../components/LeaderboardWidget';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;

  const [employees, leads, settings, invoices] = await Promise.all([
    getEmployees(),
    getLeads(),
    getSystemSettings(),
    prisma.invoice.findMany()
  ]);

  const reports = generateSalaryReport(employees, leads, invoices);
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);
  const leaderboard = [...reports].sort((a, b) => b.conversions - a.conversions);
  
  const blindMode = settings['LeaderboardBlindMode'] === 'true';

  return (
    <DashboardLayout role={role}>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 py-6">
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
          <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-gray-100">
            Company Leaderboard
          </h1>
          <LeaderboardWidget 
            report={myReport} 
            leaderboard={leaderboard} 
            blindMode={blindMode} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
