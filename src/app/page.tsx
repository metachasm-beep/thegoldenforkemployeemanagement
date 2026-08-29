import { getEmployees, getLeads, generateSalaryReport } from './actions';
import EmployeeForm from './components/EmployeeForm';
import LeadForm from './components/LeadForm';
import LeadsKanban from './components/LeadsKanban';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ExpensePTOForms from './components/ExpensePTOForms';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession();
  
  // If not logged in, force them to the login page
  if (!session || !session.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;

  const employees = await getEmployees();
  const leads = await getLeads();
  const reports = await generateSalaryReport();

  const isManager = role === 'Manager';
  
  // Find the specific report for the logged in employee (if they are an employee)
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Metachasm Enterprises</h1>
            <p className="text-gray-500 mt-2">Employee Management System & CRM</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{session.user.email}</p>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </header>
        
        {/* VIEW CONDITIONAL RENDERING */}
        {isManager ? (
          <ManagerDashboard employees={employees} leads={leads} />
        ) : (
          myReport ? (
            <EmployeeDashboard report={myReport} isMonthOne={false} />
          ) : (
            <div className="bg-white p-6 rounded-xl border border-red-200">
              <p className="text-red-500">Could not find your employee record. Please contact HR.</p>
            </div>
          )
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isManager && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Add New Employee</h2>
              <EmployeeForm />
            </section>
          )}
          
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Log a New Lead</h2>
            {/* If manager, let them choose any employee. If employee, force their own ID. */}
            <LeadForm employees={isManager ? employees : employees.filter(e => e.id === loggedInEmployeeId)} />
          </section>
        </div>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">CRM Pipeline</h2>
          <LeadsKanban 
            leads={isManager ? leads : leads.filter(l => l.employeeId === loggedInEmployeeId)} 
            employees={employees} 
          />
        </section>

        {!isManager && (
          <ExpensePTOForms employeeId={loggedInEmployeeId} />
        )}

        {isManager && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Company Payroll & Compensation Engine</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-sm uppercase text-gray-600 border-b">
                    <th className="p-4 rounded-tl-lg">Employee</th>
                    <th className="p-4">Base Fee</th>
                    <th className="p-4">Sales/Conversions</th>
                    <th className="p-4">Bonuses</th>
                    <th className="p-4 font-bold text-green-700 rounded-tr-lg">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map(report => (
                    <tr key={report.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">{report.employeeName}</td>
                      <td className="p-4">${report.baseSalary.toLocaleString()}</td>
                      <td className="p-4 text-center">{report.conversions}</td>
                      <td className="p-4">${report.commission.toLocaleString()}</td>
                      <td className="p-4 font-bold text-green-700">${report.totalPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No data available</td></tr>
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
