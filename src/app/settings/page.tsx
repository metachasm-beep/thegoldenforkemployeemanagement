import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Manager') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings & Export</h1>
        
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Data Export</h2>
          <p className="text-gray-500 mb-6">Export all payroll and CRM data for accounting software like QuickBooks or Xero.</p>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
            Export Master Payroll (.CSV)
          </button>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Custom Pipeline Stages</h2>
          <p className="text-gray-500 mb-6">Modify the columns available in the Leads Kanban board.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="New Stage Name" className="flex-1 px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white" />
            <button className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors">
              Add Stage
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
