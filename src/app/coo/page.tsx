import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { prisma } from '@/lib/prisma';
import { sweepIdleCooSessions } from '@/services/cooService';
import CooOperationsClient from '../components/CooOperationsClient';

export const dynamic = 'force-dynamic';

export default async function CooOperationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  if (role !== 'Manager' && role !== 'COO') {
    redirect('/');
  }

  await sweepIdleCooSessions().catch(() => {});

  const [employees, leads, sessions, weeklyReports, monthlyLedgers, deployments] = await Promise.all([
    getEmployees(),
    getLeads(),
    prisma.cooWorkSession
      .findMany({ orderBy: { startedAt: 'desc' }, take: 150 })
      .catch(() => []),
    prisma.cooWeeklyReport
      .findMany({ orderBy: { weekStartDate: 'desc' }, take: 52 })
      .catch(() => []),
    prisma.cooMonthlyLedger
      .findMany({ orderBy: { month: 'desc' }, take: 36 })
      .catch(() => []),
    prisma.merchantDeployment
      .findMany({ orderBy: { updatedAt: 'desc' }, take: 200 })
      .catch(() => []),
  ]);

  const cooEmployee =
    employees.find(e => e.role === 'COO' || e.email.toLowerCase() === 'ankurotto@gmail.com') || null;

  return (
    <DashboardLayout role={role}>
      <div className="w-full min-w-0">
        <CooOperationsClient
          isFounder={role === 'Manager'}
          isCoo={role === 'COO'}
          cooEmployee={cooEmployee}
          sessions={JSON.parse(JSON.stringify(sessions))}
          weeklyReports={JSON.parse(JSON.stringify(weeklyReports))}
          monthlyLedgers={JSON.parse(JSON.stringify(monthlyLedgers))}
          deployments={JSON.parse(JSON.stringify(deployments))}
          leads={leads}
          employees={employees}
        />
      </div>
    </DashboardLayout>
  );
}
