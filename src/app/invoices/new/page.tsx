import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import InvoiceForm from '@/app/components/InvoiceForm';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { generateSalaryReport } from '@/lib/payroll';
import DownloadPaystubButton from '@/app/components/DownloadPaystubButton';
import { prisma } from '@/lib/prisma';

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const employeeId = (session.user as any).employeeId;

  const [employees, leads, invoices] = await Promise.all([
    getEmployees(),
    getLeads(),
    prisma.invoice.findMany()
  ]);

  const reports = generateSalaryReport(employees, leads, invoices);
  const myReport = reports.find(r => r.employeeId === employeeId);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 py-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Generate Monthly Invoice</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate and store your official monthly invoice directly in the system database. This will be automatically embedded in your generated PDF Paystub.
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <InvoiceForm employeeId={employeeId} />
          {myReport && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Download Records</h3>
              <p className="text-sm text-gray-500 mb-4">Export your current paystub as an official PDF document.</p>
              <DownloadPaystubButton report={myReport} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
