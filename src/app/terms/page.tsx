import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function TermsOfUsePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">Internal Terms of Use</h1>
        
        <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing and using The Golden Fork internal employee and contractor platform ("the Platform"), operated by Metachasm Enterprises, you agree to be bound by these Internal Terms of Use. If you do not agree to these terms, you must cease use of the Platform immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Confidentiality and Data Security</h2>
          <p>
            As a user of the Platform, you will have access to sensitive business data, including client leads, financial reports, and proprietary sales strategies. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Maintain the strict confidentiality of all data hosted on this Platform.</li>
            <li>Not export, scrape, copy, or distribute client leads or business logic to any third party or competitor.</li>
            <li>Protect your account credentials and never share your login access with unauthorized personnel.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Acceptable Use and Integrity</h2>
          <p>You agree to use the Platform in a professional, honest, and lawful manner. Prohibited activities include, but are not limited to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Submitting false sales leads or fraudulently altering CRM statuses to manipulate commission payouts.</li>
            <li>Generating fake or duplicated invoices.</li>
            <li>Attempting to bypass access controls, "blind mode" settings, or escalating your privileges without authorization.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Commission and Payroll Disclaimers</h2>
          <p>
            The estimated earnings displayed on this Platform are system-generated based on logged data. All final payouts are subject to manual audit, verification of lead validity, and compliance with the <strong>Metachasm Sales Contractor Agreement</strong>. Any discrepancies must be reported to management prior to the billing cycle closure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Termination of Access</h2>
          <p>
            Metachasm Enterprises reserves the right to suspend or terminate your access to the Platform at any time, with or without notice, in the event of a breach of these Terms, suspected fraud, or termination of your underlying employment/contractor agreement.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
