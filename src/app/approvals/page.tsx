import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getExpenses, getPTO } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Manager') {
    redirect('/');
  }

  const expenses = await getExpenses();
  const ptos = await getPTO();

  const pendingExpenses = expenses.filter((e: any) => e.status === 'Pending');
  const pendingPTOs = ptos.filter((p: any) => p.status === 'Pending');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approval Queue</h1>
        
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            💸 Pending Expenses ({pendingExpenses.length})
          </h2>
          <div className="space-y-4">
            {pendingExpenses.map((exp: any) => (
              <div key={exp.expenseId} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">${exp.amount}</p>
                  <p className="text-sm text-gray-500">{exp.description} - {exp.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold">Approve</button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Deny</button>
                </div>
              </div>
            ))}
            {pendingExpenses.length === 0 && <p className="text-gray-500">No pending expenses.</p>}
          </div>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            🌴 Pending PTO ({pendingPTOs.length})
          </h2>
          <div className="space-y-4">
            {pendingPTOs.map((pto: any) => (
              <div key={pto.ptoId} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{pto.startDate} to {pto.endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold">Approve</button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Deny</button>
                </div>
              </div>
            ))}
            {pendingPTOs.length === 0 && <p className="text-gray-500">No pending PTO requests.</p>}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
