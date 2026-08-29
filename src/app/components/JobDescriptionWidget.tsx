import { Info } from 'lucide-react';

export default function JobDescriptionWidget({ role }: { role: string }) {
  if (role === 'Sales Executive') {
    return (
      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Info size={18} /></span>
          Role Overview: Sales Executive
        </h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p>As a Sales Executive, you are the growth engine of the company. Your primary focus is generating revenue through consistent outreach and effectively matching our solutions to client needs, culminating in annual subscription purchases via our product portal.</p>
          
          <h3 className="font-bold text-gray-900 dark:text-white mt-4">Key Responsibilities:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pipeline Management:</strong> Promptly log all interactions, calls, and referrals into the CRM. Maintain an up-to-date Kanban board, ensuring no lead remains in "Pending" for more than 48 hours without next steps.</li>
            <li><strong>Outreach & Prospecting:</strong> Consistently execute daily outbound activities to maintain a healthy and active pipeline.</li>
            <li><strong>Qualification & Pitching:</strong> Carefully qualify prospects to ensure a strong mutual fit. Deliver high-impact product demonstrations focused on client ROI.</li>
            <li><strong>Closing:</strong> Successfully guide clients to the product portal to finalize their annual subscription purchases (please note: monthly subscriptions do not count toward quota).</li>
            <li><strong>Pipeline Hygiene:</strong> Provide clear, detailed notes (minimum 50 characters) when updating a lead's status to "Lost" or "Pending" to help us improve our processes.</li>
          </ul>

          <h3 className="font-bold text-gray-900 dark:text-white mt-4">Performance & Compensation Expectations:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Standard Target:</strong> The baseline expectation for a standard month is <strong>5 annual subscriptions</strong>, which unlocks the full ₹45,000 base salary.</li>
            <li><strong>Missed Targets & Probation:</strong> If you miss the target of 5 but secure at least 2 sales, you will receive the salary for that month. However, you will be placed on a <strong>Probation Month</strong> for the following cycle.</li>
            <li><strong>Carry-Over Goal:</strong> During a Probation Month, any missed sales from the previous month will be added to your standard target of 5. <em>(For example: if you closed 3 out of 5 sales last month, your new goal for the probation month is 5 + the 2 you missed = 7 sales).</em></li>
            <li><strong>Probation Review:</strong> Successfully hitting your total target during a Probation Month returns you to standard status. Falling short of this target indicates a misalignment with the role requirements, and will result in a separation of employment. <em>(Note: Securing at least 2 sales during this final month will still unlock a payout of ₹15,000)</em>.</li>
          </ul>
        </div>
      </section>
    );
  }

  if (role === 'Team Lead') {
    return (
      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><Info size={18} /></span>
          Role Overview: Team Lead
        </h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p>As a Team Lead, you act as both a top-performing individual contributor and a dedicated mentor. You lead by example in the field while guiding your assigned squad to achieve their goals.</p>
          
          <h3 className="font-bold text-gray-900 dark:text-white mt-4">Key Responsibilities:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Direct Sales:</strong> Fulfill all core responsibilities of a Sales Executive, consistently meeting your personal monthly targets for annual subscriptions.</li>
            <li><strong>Squad Support:</strong> Monitor your squad's daily pipeline. Identify slow-moving leads, encourage CRM best practices, and offer strategic help on deals that are at risk.</li>
            <li><strong>Mentorship:</strong> Hold weekly pipeline reviews with your team. Shadow calls and product demonstrations to provide constructive feedback and coaching.</li>
            <li><strong>Administrative Support:</strong> Review and process PTO and expense requests for your squad members promptly to keep the team moving smoothly.</li>
          </ul>

          <h3 className="font-bold text-gray-900 dark:text-white mt-4">Metrics & Incentives:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>You are evaluated on your personal close rate (Standard Sales Executive targets and probation rules apply).</li>
            <li><strong>Leadership Incentive:</strong> As a reward for your mentorship, you earn a bonus of <strong>₹1,000</strong> for every annual subscription successfully closed by a member of your assigned squad.</li>
          </ul>
        </div>
      </section>
    );
  }

  if (role === 'Manager') {
    return (
      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Info size={18} /></span>
          Role Overview: Manager
        </h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p>As a Manager, you oversee the overarching operational health and success of the sales organization. You ensure that the team is supported, the pipeline is accurate, and the financial processes are secure.</p>
          
          <h3 className="font-bold text-gray-900 dark:text-white mt-4">Key Responsibilities:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Strategic Analytics:</strong> Monitor company-wide performance metrics, pipeline health, conversion timelines, and lead-source ROI to guide strategic decisions.</li>
            <li><strong>Team Optimization:</strong> Ensure team members are active and engaged. Manage onboarding and offboarding processes, and dynamically reassign leads to maintain momentum.</li>
            <li><strong>Financial Verification:</strong> Audit and verify that clients have successfully completed payment on the product portal before finalizing "Converted" leads for commission payouts. Manage clawbacks for refunded accounts if necessary.</li>
            <li><strong>System & Payroll Administration:</strong> Manage system-wide announcements, adjust dashboard settings, and perform final audits on the Master Payroll Ledger prior to end-of-month disbursements.</li>
            <li><strong>Quality Assurance:</strong> Utilize administrative access to review team workflows, read pipeline notes, and provide high-level coaching to ensure compliance and quality across the board.</li>
          </ul>
        </div>
      </section>
    );
  }

  return null;
}
