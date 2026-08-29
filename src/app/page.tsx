import { getEmployees, getLeads, generateSalaryReport, getSystemSettings } from './actions';
import EmployeeForm from './components/EmployeeForm';
import LeadForm from './components/LeadForm';
import LeadsKanban from './components/LeadsKanban';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ExpensePTOForms from './components/ExpensePTOForms';
import DashboardLayout from './components/DashboardLayout';
import PayrollTable from './components/PayrollTable';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;

  const employees = await getEmployees();
  const leads = await getLeads();
  const reports = await generateSalaryReport();
  const settings = await getSystemSettings();

  const isManager = role === 'Manager';
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);
  const leaderboard = [...reports].sort((a, b) => b.conversions - a.conversions);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {isManager ? (
          <ManagerDashboard employees={employees} leads={leads} />
        ) : (
          myReport ? (
            <EmployeeDashboard report={myReport} settings={settings} leaderboard={leaderboard} />
          ) : (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 shadow-sm">
              <p className="font-semibold">⚠️ Employee record unlinked. Please contact HR.</p>
            </div>
          )
        )}

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">⚖️</span>
            Payout & Probation Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Month 1 (Probation)</h3>
              <ul className="list-disc pl-4 space-y-2">
                <li><span className="font-semibold text-green-600 dark:text-green-400">≥ 2 Sales:</span> ₹15,000 Base Salary</li>
                <li><span className="font-semibold text-red-600 dark:text-red-400">&lt; 2 Sales:</span> ₹0 Base + Termination Risk</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Month 2+ (Standard)</h3>
              <ul className="list-disc pl-4 space-y-2">
                <li><span className="font-semibold text-green-600 dark:text-green-400">≥ 5 Sales:</span> ₹45,000 Base Salary</li>
                <li><span className="font-semibold text-amber-600 dark:text-amber-500">&lt; 5 Sales:</span> ₹9,000 per Sale<br/><span className="text-xs text-gray-500">(Triggers auto-relegation to Month 1 rules)</span></li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bonuses</h3>
              <ul className="list-disc pl-4 space-y-2">
                <li><span className="font-semibold text-blue-600 dark:text-blue-400">Performance:</span> ₹5,000 per sale over monthly quota (5)</li>
                <li><span className="font-semibold text-purple-600 dark:text-purple-400">Milestone:</span> ₹100,000 every 100 cumulative sales</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isManager && (
            <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">👥</span>
                Onboard Employee
              </h2>
              <EmployeeForm teamLeads={employees.filter(e => e.role === 'Team Lead')} />
            </section>
          )}
          
          <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">⚡</span>
              Log a New Lead
            </h2>
            <LeadForm employees={isManager ? employees : employees.filter(e => e.id === loggedInEmployeeId)} />
          </section>
        </div>

        <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">📈</span>
            Active Pipeline
          </h2>
          <LeadsKanban 
            leads={isManager ? leads : leads.filter(l => l.employeeId === loggedInEmployeeId)} 
            employees={employees} 
          />
        </section>

        {!isManager && (
          <ExpensePTOForms employeeId={loggedInEmployeeId} />
        )}

        {isManager && (
          <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-gray-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">💰</span>
              Master Payroll Ledger
            </h2>
            <PayrollTable reports={reports} />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}


