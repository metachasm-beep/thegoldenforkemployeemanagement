import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EmployeeForm from '../components/EmployeeForm';
import { getEmployees, generateSalaryReport } from '../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/');
  const role = (session.user as any).role;

  if (role !== 'Manager' && role !== 'Team Lead') {
    redirect('/');
  }

  const isManager = role === 'Manager';
  const loggedInEmployeeId = (session.user as any).employeeId;

  const allEmployees = await getEmployees();
  const reports = await generateSalaryReport();

  // RBAC: Manager sees all, Team Lead sees only their assigned employees
  const employees = isManager 
    ? allEmployees 
    : allEmployees.filter(emp => emp.managerId === loggedInEmployeeId);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {isManager && (
            <div className="lg:col-span-1">
              <EmployeeForm teamLeads={allEmployees.filter(e => e.role === 'Team Lead')} />
            </div>
          )}

          <div className={isManager ? "lg:col-span-2" : "lg:col-span-3"}>
            <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Active Employees</h2>
              <div className="space-y-4">
                {employees.map(emp => {
                  const r = reports.find(r => r.employeeId === emp.id);
                  return (
                    <div key={emp.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{emp.name}</p>
                        <p className="text-sm text-gray-500">{emp.email} • {emp.role}</p>
                        {r && (
                          <div className="text-xs font-semibold mt-2 text-indigo-600 dark:text-indigo-400">
                            {isManager 
                              ? `Base: ₹${r.baseSalary.toLocaleString()} | Net: ₹${r.totalPayout.toLocaleString()}` 
                              : `Base: *** | Net: ***`
                            }
                          </div>
                        )}
                      </div>

                      {isManager && (
                        <div className="flex gap-2">
                          <Link href={`/team/impersonate/${emp.id}`} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-bold transition-colors">
                            Log in as...
                          </Link>
                          <form action={async () => {
                            'use server';
                            const { offboardEmployee } = await import('../actions');
                            await offboardEmployee(emp.id);
                          }}>
                            <button className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition-colors">
                              Offboard
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
