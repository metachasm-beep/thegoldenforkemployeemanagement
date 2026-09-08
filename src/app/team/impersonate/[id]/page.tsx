import DashboardLayout from '@/app/components/DashboardLayout';
import EmployeeView from '@/app/components/EmployeeView';
import ManagerView from '@/app/components/ManagerView';
import { prisma } from '@/lib/prisma';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { getSystemSettings } from '@/lib/db/settings';
import { generateSalaryReport } from '@/lib/payroll';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ImpersonatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Manager') redirect('/');

  const { id } = await params;

  const [employees, leads, settings, auditLogs, invoices] = await Promise.all([
    getEmployees(),
    getLeads(),
    getSystemSettings(),
    prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 20 }),
    prisma.invoice.findMany()
  ]);

  const emp = employees.find(e => e.id === id);
  const reports = generateSalaryReport(employees, leads, invoices);
  const myReport = reports.find(r => String(r.employeeId) === id);

  if (!myReport) {
    return (
      <DashboardLayout role="Employee">
        <div className="max-w-7xl mx-auto p-10">
          <p className="text-red-500 font-bold">Employee not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={emp?.role || "Employee"}>
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

        {(() => {
          if (!emp) return null;
          
          const isManagerRole = emp.role === 'Manager' || emp.role === 'HR';
          const isHRRole = emp.role === 'HR';

          if (isManagerRole) {
            return <ManagerView employees={employees} leads={leads} reports={reports} auditLogs={auditLogs} isHR={isHRRole} />;
          } else {
            return (
              <EmployeeView 
                loggedInEmployeeId={id} 
                employees={employees} 
                leads={leads} 
                reports={reports} 
                settings={settings} 
              />
            );
          }
        })()}
      </div>
    </DashboardLayout>
  );
}
