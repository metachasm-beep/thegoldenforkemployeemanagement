import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { Employee } from '@/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function OrgNode({ employee, allEmployees }: { employee: Employee; allEmployees: Employee[] }) {
  const directReports = allEmployees.filter(e => e.managerId === employee.id);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 shadow-lg rounded-xl p-4 w-48 text-center relative z-10 transition-transform hover:scale-105 cursor-pointer">
        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold mx-auto mb-2 border border-indigo-200 dark:border-indigo-800">
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{employee.name}</p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{employee.role}</p>
      </div>
      
      {directReports.length > 0 && (
        <div className="flex flex-col items-center mt-4 relative">
          <div className="w-px h-6 bg-indigo-300 dark:bg-indigo-800 absolute -top-4"></div>
          
          <div className="flex justify-center gap-6 relative pt-4">
            {directReports.length > 1 && (
              <div className="absolute top-0 left-[20%] right-[20%] h-px bg-indigo-300 dark:bg-indigo-800"></div>
            )}
            {directReports.map((report, idx) => (
              <div key={report.id} className="relative">
                <div className="w-px h-4 bg-indigo-300 dark:bg-indigo-800 absolute top-0 left-1/2 -translate-x-1/2"></div>
                <div className="pt-4">
                  <OrgNode employee={report} allEmployees={allEmployees} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/');
  const role = (session.user as any).role;

  if (role !== 'Manager' && role !== 'Team Lead') {
    redirect('/');
  }

  const allEmployees = await getEmployees();
  
  // Find roots (Employees without a manager, or Managers themselves)
  let roots = allEmployees.filter(e => !e.managerId);
  if (roots.length === 0 && allEmployees.length > 0) {
    // Fallback if everyone has a manager somehow
    roots = [allEmployees[0]];
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Company Org Chart
          </h1>
          <Link href="/team" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold transition-colors">
            Back to Team List
          </Link>
        </div>

        <div className="bg-gray-50/50 dark:bg-gray-900/50 p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-inner overflow-x-auto min-h-[600px] flex justify-center pt-12">
          {roots.map(root => (
            <OrgNode key={root.id} employee={root} allEmployees={allEmployees} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
