import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EmployeeForm from '../components/EmployeeForm';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { generateSalaryReport } from '@/lib/payroll';
import { offboardEmployee, forceLogoutEmployee } from '../actions';
import Link from 'next/link';
import SubmitButton from '../components/SubmitButton';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/');
  const role = (session.user as any).role;

  if (role !== 'Manager' && role !== 'Team Lead') {
    redirect('/');
  }

  const isManager = role === 'Manager';
  const allEmployees = await getEmployees();
  
  const employees = isManager 
    ? allEmployees 
    : allEmployees.filter(e => e.managerId === (session.user as any).employeeId);

  const leads = await getLeads();
  const reports = generateSalaryReport(employees, leads);

  // Determine Top Performer
  let topPerformers = [...reports].sort((a,b) => b.conversions - a.conversions);

  return (
    <DashboardLayout role={role}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-balance">Team Directory</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-pretty">Manage employees, view payroll, and handle offboarding.</p>
          </div>
          
          {isManager && (
            <Link 
              href="/team/org-chart" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              View Org Chart
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {isManager && (
            <div className="lg:col-span-1">
              <EmployeeForm teamLeads={allEmployees.filter(e => e.role === 'Team Lead')} />
            </div>
          )}

          <div className={isManager ? "lg:col-span-2" : "lg:col-span-3"}>
            <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-balance">Active Employees</h2>
              <div className="space-y-4">
                {employees.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No active employees found.</p>
                )}
                {employees.map(emp => {
                  const r = reports.find(r => r.employeeId === emp.id);
                  const offboardWithId = offboardEmployee.bind(null, emp.id);
                  const isTopPerformer = isManager && topPerformers && topPerformers[0]?.employeeId === emp.id && r && r.conversions > 0;
                  
                  return (
                    <div key={emp.id} className={`w-full p-4 rounded-xl border ${isTopPerformer ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors`}>
                      <div className="flex items-center gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`} alt={emp.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{emp.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{emp.email} • {emp.role}</p>
                          {r && (
                            <div className="text-xs font-semibold mt-1 text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {isManager 
                                ? `Base: ₹${r.baseSalary.toLocaleString()} | Net: ₹${r.totalPayout.toLocaleString()}` 
                                : `Base: *** | Net: ***`
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      {isManager && (
                        <div className="flex gap-2 flex-wrap items-center">
                          <Link href={`/team/impersonate/${emp.id}`} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors">
                            Log in
                          </Link>
                          <form action={forceLogoutEmployee.bind(null, emp.id)}>
                            <button type="submit" className="py-1.5 px-3 rounded-lg text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 font-medium transition-colors">
                              Force Logout
                            </button>
                          </form>
                          <form action={offboardWithId}>
                            <SubmitButton text="Offboard" loadingText="Removing..." variant="danger" className="py-1.5 text-sm" />
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
