import { getEmployees, getLeads, generateSalaryReport } from './actions';
import EmployeeForm from './components/EmployeeForm';
import LeadForm from './components/LeadForm';
import LeadsList from './components/LeadsList';
import ManagerDashboard from './components/ManagerDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const employees = await getEmployees();
  const leads = await getLeads();
  const reports = await generateSalaryReport();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Metachasm Enterprises</h1>
            <p className="text-gray-500 mt-2">Employee Management System & CRM</p>
          </div>
        </header>
        
        <ManagerDashboard employees={employees} leads={leads} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Add New Employee</h2>
            <EmployeeForm />
          </section>
          
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Log a New Lead</h2>
            <LeadForm employees={employees} />
          </section>
        </div>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Lead CRM</h2>
          <LeadsList leads={leads} />
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Payroll & Compensation Engine</h2>
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
      </div>
    </div>
  );
}
