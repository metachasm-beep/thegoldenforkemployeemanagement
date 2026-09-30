import { Employee, Lead, SalaryReport } from '@/types';
import EmployeeDashboard from './EmployeeDashboard';
import LeadsBoard from './LeadsBoard';

import { CustomFieldDefinition } from '@/types';

type Props = {
  loggedInEmployeeId: string;
  employees: Employee[];
  leads: Lead[];
  reports: SalaryReport[];
  settings: Record<string, string>;
  customFieldDefs?: CustomFieldDefinition[];
};

export default function EmployeeView({
  loggedInEmployeeId,
  employees,
  leads,
  reports,
  settings,
  customFieldDefs = [],
}: Props) {
  const myReport = reports.find(r => r.employeeId === loggedInEmployeeId);
  
  const loggedInEmployee = employees.find(e => e.id === loggedInEmployeeId);
  const isTeamLead = loggedInEmployee?.role === 'Team Lead';

  const myLeads = leads.filter(l => {
    if (l.employeeId === loggedInEmployeeId) return true;
    if (isTeamLead) {
      const leadOwner = employees.find(e => e.id === l.employeeId);
      return leadOwner?.managerId === loggedInEmployeeId;
    }
    return false;
  });

  if (!myReport) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 shadow-sm">
        <p className="font-semibold">⚠️ Employee record unlinked. Please contact HR.</p>
      </div>
    );
  }

  const teamEmployees = isTeamLead
    ? employees.filter(e => e.id === loggedInEmployeeId || e.managerId === loggedInEmployeeId)
    : loggedInEmployee ? [loggedInEmployee] : [];

  return (
    <section className="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800">
      <h2 className="text-3xl font-serif font-black tracking-tight mb-8 text-slate-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">📊</span>
        My Pipeline
      </h2>
      <LeadsBoard initialLeads={myLeads} employees={teamEmployees} isManager={isTeamLead} customFieldDefs={customFieldDefs} />
    </section>
  );
}
