import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getExpenses, getPTO } from '@/lib/db/approvals';
import SubmitButton from '../components/SubmitButton';
import { updateExpenseStatus, updatePTOStatus, updateLeadStatusWithReason } from '../actions';
import { getLeads } from '@/lib/db/leads';
import RejectLeadButton from './RejectLeadButton';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/');
  const role = (session.user as any)?.role;
  if (role !== 'Manager' && role !== 'Team Lead') {
    redirect('/');
  }

  const isManager = role === 'Manager';
  const loggedInEmployeeId = (session.user as any).employeeId;

  const { getEmployees } = await import('@/lib/db/employees');
  const employees = await getEmployees();
  
  // Find all employees that belong to this Team Lead
  const assignedEmployeeIds = employees
    .filter(emp => emp.managerId === loggedInEmployeeId)
    .map(emp => emp.id);

  
  const leads = await getLeads();
  const pendingLeads = leads.filter(l => 
    l.status === 'Pending Verification' && (isManager || assignedEmployeeIds.includes(l.employeeId))
  );

  const expenses = await getExpenses();
  const ptos = await getPTO();

  const pendingExpenses = expenses.filter((e: any) => 
    e.status === 'Pending' && (isManager || assignedEmployeeIds.includes(e.employeeId))
  );
  
  const pendingPTOs = ptos.filter((p: any) => 
    p.status === 'Pending' && (isManager || assignedEmployeeIds.includes(p.employeeId))
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approval Queue</h1>
        
        
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            📊 Pending Sales Conversions ({pendingLeads.length})
          </h2>
          <div className="space-y-4">
            {pendingLeads.map((lead: any) => {
              const approve = updateLeadStatusWithReason.bind(null, lead.leadId, 'Converted', '');
              return (
              <div key={lead.leadId} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      Lead: {lead.assignee}
                      <span className="text-sm font-normal text-gray-500 ml-2">Logged by {employees.find(e => e.id === lead.employeeId)?.name || 'Unknown'} (ID: {lead.employeeId.slice(0,8)})</span>
                    </p>
                    <p className="text-sm text-gray-500">Date: {lead.date}</p>
                    {lead.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic border-l-2 pl-2 border-indigo-200">"{lead.notes}"</p>}
                  </div>
                <div className="flex gap-2 self-end">
                  <form action={approve}>
                    <SubmitButton text="Verify & Approve" loadingText="Wait..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-4 py-2 text-sm" />
                  </form>
                  
                  <RejectLeadButton leadId={lead.leadId} />
                </div>
              </div>
            )})}
            {pendingLeads.length === 0 && <p className="text-gray-500">No pending sales to verify.</p>}
          </div>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            💸 Pending Expenses ({pendingExpenses.length})
          </h2>
          <div className="space-y-4">
            {pendingExpenses.map((exp: any) => {
              const approve = updateExpenseStatus.bind(null, exp.expenseId, 'Approved');
              const deny = updateExpenseStatus.bind(null, exp.expenseId, 'Denied');
              return (
              <div key={exp.expenseId} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      ₹{exp.amount} <span className="text-sm font-normal text-gray-500 ml-2">by {employees.find(e => e.id === exp.employeeId)?.name || 'Unknown'} (ID: {exp.employeeId.slice(0,8)})</span>
                    </p>
                    <p className="text-sm text-gray-500">{exp.description} - {exp.date}</p>
                  </div>
                <div className="flex gap-2">
                  <form action={approve}>
                    <SubmitButton text="Approve" loadingText="Wait..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-4 py-2 text-sm" />
                  </form>
                  <form action={deny}>
                    <SubmitButton text="Deny" loadingText="Wait..." variant="danger" className="px-4 py-2 text-sm" />
                  </form>
                </div>
              </div>
            )})}
            {pendingExpenses.length === 0 && <p className="text-gray-500">No pending expenses.</p>}
          </div>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            🌴 Pending PTO ({pendingPTOs.length})
          </h2>
          <div className="space-y-4">
            {pendingPTOs.map((pto: any) => {
              const approve = updatePTOStatus.bind(null, pto.ptoId, 'Approved');
              const deny = updatePTOStatus.bind(null, pto.ptoId, 'Denied');
              return (
              <div key={pto.ptoId} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {pto.startDate} to {pto.endDate}
                    </p>
                    <p className="text-sm text-gray-500">Requested by: {employees.find(e => e.id === pto.employeeId)?.name || 'Unknown'} (ID: {pto.employeeId.slice(0,8)})</p>
                  </div>
                <div className="flex gap-2">
                  <form action={approve}>
                    <SubmitButton text="Approve" loadingText="Wait..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-4 py-2 text-sm" />
                  </form>
                  <form action={deny}>
                    <SubmitButton text="Deny" loadingText="Wait..." variant="danger" className="px-4 py-2 text-sm" />
                  </form>
                </div>
              </div>
            )})}
            {pendingPTOs.length === 0 && <p className="text-gray-500">No pending PTO requests.</p>}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


