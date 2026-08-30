import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getExpenses, getPTO } from '@/lib/db/approvals';
import SubmitButton from '../components/SubmitButton';
import { updateExpenseStatus, updatePTOStatus, updateLeadStatusWithReason } from '../actions';
import { getLeads } from '@/lib/db/leads';
import RejectLeadButton from './RejectLeadButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
        
        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            ✅ Pending Sales Conversions <Badge variant="secondary">{pendingLeads.length}</Badge>
          </h2>
          
          <div className="rounded-md border border-gray-100 dark:border-gray-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeads.map((lead: any) => {
                  const approve = updateLeadStatusWithReason.bind(null, lead.leadId, 'Converted', '');
                  const emp = employees.find(e => e.id === lead.employeeId);
                  return (
                    <TableRow key={lead.leadId}>
                      <TableCell className="font-medium">{lead.assignee}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{emp?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{lead.employeeId.slice(0,8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-500">
                        {lead.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <RejectLeadButton leadId={lead.leadId} />
                          <form action={approve}>
                            <SubmitButton text="Approve" loadingText="..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1.5 text-xs rounded-md h-auto" />
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No pending sales to verify.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            💸 Pending Expenses <Badge variant="secondary">{pendingExpenses.length}</Badge>
          </h2>
          
          <div className="rounded-md border border-gray-100 dark:border-gray-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExpenses.map((exp: any) => {
                  const approve = updateExpenseStatus.bind(null, exp.expenseId, 'Approved');
                  const deny = updateExpenseStatus.bind(null, exp.expenseId, 'Denied');
                  const emp = employees.find(e => e.id === exp.employeeId);
                  return (
                    <TableRow key={exp.expenseId}>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-500 font-mono">₹{exp.amount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{emp?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{exp.employeeId.slice(0,8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>{exp.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <form action={deny}>
                            <SubmitButton text="Deny" loadingText="..." variant="danger" className="px-3 py-1.5 text-xs rounded-md h-auto" />
                          </form>
                          <form action={approve}>
                            <SubmitButton text="Approve" loadingText="..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1.5 text-xs rounded-md h-auto" />
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No pending expenses.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            🌴 Pending PTO <Badge variant="secondary">{pendingPTOs.length}</Badge>
          </h2>
          
          <div className="rounded-md border border-gray-100 dark:border-gray-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Dates</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPTOs.map((pto: any) => {
                  const approve = updatePTOStatus.bind(null, pto.ptoId, 'Approved');
                  const deny = updatePTOStatus.bind(null, pto.ptoId, 'Denied');
                  const emp = employees.find(e => e.id === pto.employeeId);
                  return (
                    <TableRow key={pto.ptoId}>
                      <TableCell className="font-medium">{pto.startDate} to {pto.endDate}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{emp?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{pto.employeeId.slice(0,8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <form action={deny}>
                            <SubmitButton text="Deny" loadingText="..." variant="danger" className="px-3 py-1.5 text-xs rounded-md h-auto" />
                          </form>
                          <form action={approve}>
                            <SubmitButton text="Approve" loadingText="..." className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1.5 text-xs rounded-md h-auto" />
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingPTOs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                      No pending PTO requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
