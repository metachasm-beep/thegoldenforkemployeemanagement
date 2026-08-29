import DashboardLayout from '@/app/components/DashboardLayout';
import EmployeeDashboard from '@/app/components/EmployeeDashboard';
import { getSystemSettings, generateSalaryReport } from '@/app/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ImpersonatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Manager') {
    redirect('/');
  }

  const { id } = await params;

  const reports = await generateSalaryReport();
  const myReport = reports.find(r => String(r.employeeId) === id);
  const settings = await getSystemSettings();
  const leaderboard = [...reports].sort((a, b) => b.conversions - a.conversions);

  if (!myReport) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-10">
          <p className="text-red-500 font-bold">Employee not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
        <div className="flex items-center gap-4 bg-red-100 text-red-800 p-4 rounded-2xl border border-red-200">
          <Link href="/team" className="p-2 hover:bg-red-200 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg">God Mode (Impersonation Active)</h1>
            <p className="text-sm">You are currently viewing the exact dashboard for {myReport.employeeName}.</p>
          </div>
        </div>

        <EmployeeDashboard report={myReport} settings={settings} leaderboard={leaderboard} />
      </div>
    </DashboardLayout>
  );
}
