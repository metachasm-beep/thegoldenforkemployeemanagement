import { getEmployees, getLeads, generateSalaryReport } from './actions';
import EmployeeForm from './components/EmployeeForm';
import LeadForm from './components/LeadForm';
import LeadsList from './components/LeadsList';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [employees, leads, salaryReport] = await Promise.all([
    getEmployees(),
    getLeads(),
    generateSalaryReport()
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-bold text-gray-900">Employee Management System</h1>
          <p className="text-gray-500 mt-2">Manage employees, track leads, and calculate salaries.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* EMPLOYEES SECTION */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Employees</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Base Salary</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Commission Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">No employees found.</td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{emp.name}</td>
                        <td className="py-3 px-4">{emp.role}</td>
                        <td className="py-3 px-4">${emp.baseSalary}</td>
                        <td className="py-3 px-4">${emp.commissionRate}/conversion</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ADD EMPLOYEE FORM */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">Add Employee</h2>
            <EmployeeForm />
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEADS & CONVERSIONS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">Log Lead / Conversion</h2>
            <LeadForm employees={employees} />
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Recent Leads</h3>
              <LeadsList leads={leads} employees={employees} />
            </div>
          </section>

          {/* SALARY REPORT */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">Salary Report</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Conversions</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">Total Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryReport.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">No data available.</td>
                    </tr>
                  ) : (
                    salaryReport.map(report => (
                      <tr key={report.employeeId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{report.employeeName}</td>
                        <td className="py-3 px-4">
                          {report.conversions} <span className="text-sm text-green-600">(+${report.commission})</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">${report.totalPayout}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
