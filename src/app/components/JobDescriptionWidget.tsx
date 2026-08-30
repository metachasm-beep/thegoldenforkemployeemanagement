import { Info } from 'lucide-react';

export default function JobDescriptionWidget({ role }: { role: string }) {
  if (role === 'Sales Executive') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Info size={12} /></span>
          Role: Sales Executive
        </h3>
        <p className="leading-relaxed">Generate revenue through consistent outreach and effectively matching solutions to client needs, culminating in annual subscription purchases via the product portal.</p>
        
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Key Responsibilities:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Pipeline:</strong> Log all interactions, no lead "Pending" &gt; 48h.</li>
          <li><strong>Outreach:</strong> High daily volume outbound.</li>
          <li><strong>Closing:</strong> Annual subscriptions only.</li>
          <li><strong>Hygiene:</strong> Min 50-char notes for lost/pending leads.</li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Expectations:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Target:</strong> 5 monthly sales for full ₹45,000 base.</li>
          <li><strong>Missed Target:</strong> &lt; 5 but &gt;= 2 pays prorated, triggers Probation.</li>
          <li><strong>Carry-Over Goal:</strong> Missed sales added to standard target in Probation.</li>
          <li><strong>Probation Review:</strong> Miss total target = separation.</li>
        </ul>
      </div>
    );
  }

  if (role === 'Team Lead') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><Info size={12} /></span>
          Role: Team Lead
        </h3>
        <p className="leading-relaxed">Top-performing individual contributor and a dedicated mentor leading by example.</p>
        
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Key Responsibilities:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Direct Sales:</strong> Fulfill Sales Exec targets.</li>
          <li><strong>Squad Support:</strong> Monitor daily pipeline, encourage CRM best practices.</li>
          <li><strong>Mentorship:</strong> Weekly reviews, shadow calls/demos.</li>
          <li><strong>Admin Support:</strong> Review PTO/expenses promptly.</li>
        </ul>

        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Metrics & Incentives:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>Evaluated on personal close rate (Sales Exec rules).</li>
          <li><strong>Leadership Incentive:</strong> ₹1,000 bonus per annual subscription closed by squad.</li>
        </ul>
      </div>
    );
  }

  if (role === 'Manager') {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Info size={12} /></span>
          Role: Manager
        </h3>
        <p className="leading-relaxed">Oversee operational health and success of the sales organization.</p>
        
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Key Responsibilities:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Strategic Analytics:</strong> Monitor company-wide metrics and ROI.</li>
          <li><strong>Team Optimization:</strong> Manage onboarding/offboarding, reassign leads.</li>
          <li><strong>Financial Verification:</strong> Audit and verify payments on product portal.</li>
          <li><strong>System/Payroll Admin:</strong> Broadcast announcements, audit Master Payroll Ledger.</li>
          <li><strong>Quality Assurance:</strong> Review team workflows and pipeline notes.</li>
        </ul>
      </div>
    );
  }

  return null;
}
