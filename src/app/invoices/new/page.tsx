import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import InvoiceForm from '@/app/components/InvoiceForm';

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const employeeId = (session.user as any).employeeId;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Generate Monthly Invoice</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate and store your official monthly invoice directly in the system database. This will be automatically embedded in your generated PDF Paystub.
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <InvoiceForm employeeId={employeeId} />
        </div>
      </div>
    </DashboardLayout>
  );
}
