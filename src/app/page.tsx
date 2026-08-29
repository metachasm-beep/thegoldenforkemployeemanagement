import { getEmployees, getLeads, generateSalaryReport } from './actions';
import EmployeeForm from './components/EmployeeForm';
import LeadForm from './components/LeadForm';
import LeadsKanban from './components/LeadsKanban';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ExpensePTOForms from './components/ExpensePTOForms';
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
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-gray-100 to-zinc-50 text-slate-800 p-4 md:p-8 font-sans selection:bg-amber-200">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* PREMIUM HEADER */}
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-xl">
                GF
              </div>
              <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">
                The Golden Fork
              </h1>
            </div>
            <p className="text-slate-500 font-medium ml-13">Next-Gen CRM & Compensation Suite</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">{session.user.email}</p>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isManager ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {role}
              </span>
            </div>
          </div>
        </header>
        
        {isManager ? (
          <ManagerDashboard employees={employees} leads={leads} />
        ) : (
          myReport ? (
            <EmployeeDashboard report={myReport} isMonthOne={false} />
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
          <section className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">💰</span>
              Master Payroll Ledger
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="p-5 font-semibold">Employee</th>
                    <th className="p-5 font-semibold">Base Fee</th>
                    <th className="p-5 font-semibold text-center">Conversions</th>
                    <th className="p-5 font-semibold">Bonuses</th>
                    <th className="p-5 font-bold text-emerald-600">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reports.map(report => (
                    <tr key={report.employeeId} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-5 font-bold text-slate-700">{report.employeeName}</td>
                      <td className="p-5 text-slate-500">${report.baseSalary.toLocaleString()}</td>
                      <td className="p-5 text-center">
                        <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full font-semibold">
                          {report.conversions}
                        </span>
                      </td>
                      <td className="p-5 text-slate-500">${report.commission.toLocaleString()}</td>
                      <td className="p-5 font-black text-emerald-600 group-hover:text-emerald-500">${report.totalPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
