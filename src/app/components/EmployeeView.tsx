import { Employee, Lead, SalaryReport } from '@/types';
import EmployeeDashboard from './EmployeeDashboard';
import LeadsKanban from './LeadsKanban';

type Props = {
  loggedInEmployeeId: string;
  employees: Employee[];
  leads: Lead[];
  reports: SalaryReport[];
  settings: Record<string, string>;
};

export default function EmployeeView({
  loggedInEmployeeId,
  employees,
  leads,
  reports,
  settings,
}: Props) {
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);
  const myLeads = leads.filter(l => l.employeeId === loggedInEmployeeId);
  const leaderboard = [...reports].sort((a, b) => b.conversions - a.conversions);

  if (!myReport) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 shadow-sm">
        <p className="font-semibold">⚠️ Employee record unlinked. Please contact HR.</p>
      </div>
    );
  }

  return (
    <>
      <EmployeeDashboard report={myReport} settings={settings} leaderboard={leaderboard} />

      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-8 text-slate-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">📊</span>
          My Pipeline
        </h2>
        <LeadsKanban leads={myLeads} employees={employees} />
      </section>
    </>
  );
}
