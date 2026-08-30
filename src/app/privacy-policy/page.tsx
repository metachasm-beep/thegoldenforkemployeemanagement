import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function PrivacyPolicyPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">Privacy Policy</h1>
        
        <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Introduction</h2>
          <p>
            Welcome to the internal employee and contractor portal of <strong>Metachasm Enterprises</strong> ("Company", "we", "us", or "our"). 
            We are committed to protecting your personal data and respecting your privacy in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Information We Collect</h2>
          <p>As part of your engagement with us, we may collect the following sensitive personal data and information (SPDI):</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identity Data:</strong> Full name, Aadhaar Number, PAN (Permanent Account Number).</li>
            <li><strong>Contact Data:</strong> Email address.</li>
            <li><strong>Financial & Performance Data:</strong> Bank account details (if provided), commission targets, sales leads generated, and performance metrics.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Purpose of Collection</h2>
          <p>We act as a Data Fiduciary and process your data strictly for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Processing payroll, commissions, and reimbursements.</li>
            <li>Regulatory compliance, including Tax Deducted at Source (TDS) under the Income Tax Act, 1961.</li>
            <li>Auditing and tracking contractor/employee performance.</li>
            <li>Maintaining the security and integrity of our CRM platform.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Data Sharing and Retention</h2>
          <p>
            Your data is stored securely on our encrypted database infrastructure. We do not sell your data. Your data may be shared with regulatory bodies (such as the Income Tax Department) or trusted third-party auditing software exclusively for compliance purposes.
          </p>
          <p>
            We will retain your personal information for as long as necessary to fulfill the purposes outlined in this policy or as mandated by Indian law (e.g., tax records must typically be kept for up to 8 years).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Your Rights</h2>
          <p>Under the DPDP Act, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request corrections to inaccurate data via the Settings page.</li>
            <li>Withdraw consent (note that withdrawing consent for PAN/Aadhaar processing may affect our ability to legally process your payouts).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Grievance Officer</h2>
          <p>
            In accordance with the IT Act, 2000 and DPDP Act, 2023, the contact details of the Grievance Officer are provided below. If you have any discrepancies or grievances, please contact:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
            <p><strong>Name:</strong> HR & Compliance Officer</p>
            <p><strong>Entity:</strong> Metachasm Enterprises</p>
            <p><strong>Email:</strong> legal@metachasm.com</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
