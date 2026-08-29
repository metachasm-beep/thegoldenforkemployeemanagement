import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EmployeeForm from '../components/EmployeeForm';
import { getEmployees } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Manager') {
    redirect('/');
  }

  const employees = await getEmployees();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <EmployeeForm />
          </div>
          <div className="lg:col-span-2">
            <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Active Employees</h2>
              <div className="space-y-4">
                {employees.map(emp => (
                  <div key={emp.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.email} • {emp.role}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


