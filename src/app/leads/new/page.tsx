import DashboardLayout from '@/app/components/DashboardLayout';
import LeadForm from '@/app/components/LeadForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  const employees = await getEmployees();
  
  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">🎯</span>
            Log a New Lead
          </h2>
          <LeadForm employees={employees.filter(e => e.id === loggedInEmployeeId)} />
        </section>
      </div>
    </DashboardLayout>
  );
}