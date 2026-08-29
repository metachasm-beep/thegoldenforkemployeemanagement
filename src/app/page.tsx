import { getEmployees, getLeads, generateSalaryReport } from './actions';
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

  const isManager = role === 'Manager';
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {isManager ? (
          <ManagerDashboard employees={employees} leads={leads} />
        ) : (
          myReport ? (
            <EmployeeDashboard report={myReport} />
          ) : (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 shadow-sm">
              <p className="font-semibold">⚠️ Employee record unlinked. Please contact HR.</p>
            </div>
          )
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isManager && (
            <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">👥</span>
                Onboard Employee
              </h2>
              <EmployeeForm />
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


