import DashboardLayout from '@/app/components/DashboardLayout';
import ExpenseForm from '@/app/components/ExpenseForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewExpensePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const loggedInEmployeeId = (session.user as any).employeeId;
  
  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Log Business Expense
          </h2>
          <p className="text-gray-500 mb-6 text-sm">Submit your reimbursable expenses below.</p>
          <ExpenseForm employeeId={loggedInEmployeeId} />
        </section>
      </div>
    </DashboardLayout>
  );
}