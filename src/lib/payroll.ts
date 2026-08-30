import { Employee, Lead, SalaryReport } from '@/types';
import { calculateMonthlyCompensation } from '@/lib/compensation';

export type PayrollContext = {
  conversions: number;
  lastMonthSales: number;
  teamSales: number;
  isMonthOne: boolean;
  joinedThisMonth: boolean;
};

export function derivePayrollContext(
  emp: Employee,
  leads: Lead[],
  allEmployees: Employee[],
  now: Date = new Date()
): PayrollContext {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const conversions = leads.filter(
    l =>
      l.employeeId === emp.id &&
      l.status === 'Converted' &&
      new Date(l.date).getMonth() === currentMonth &&
      new Date(l.date).getFullYear() === currentYear
  ).length;

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const empJoinDate = new Date(emp.startDate || '');
  const joinedThisMonth =
    empJoinDate.getMonth() === currentMonth && empJoinDate.getFullYear() === currentYear;

  const lastMonthSales = joinedThisMonth
    ? 5
    : leads.filter(
        l =>
          l.employeeId === emp.id &&
          l.status === 'Converted' &&
          new Date(l.date).getMonth() === lastMonth &&
          new Date(l.date).getFullYear() === lastMonthYear
      ).length;

  let teamSales = 0;
  if (emp.role === 'Team Lead') {
    const squadIds = allEmployees
      .filter(e => e.managerId === emp.id)
      .map(e => e.id);
    teamSales = leads.filter(
      l =>
        squadIds.includes(l.employeeId) &&
        l.status === 'Converted' &&
        new Date(l.date).getMonth() === currentMonth &&
        new Date(l.date).getFullYear() === currentYear
    ).length;
  }

  const probationEnd =
    new Date(emp.startDate || '').getTime() + emp.probationDuration * 30 * 24 * 60 * 60 * 1000;
  let isMonthOne = Date.now() < probationEnd;
  if (!isMonthOne && lastMonthSales < 5 && !joinedThisMonth) {
    isMonthOne = true; 
  }

  return { conversions, lastMonthSales, teamSales, isMonthOne, joinedThisMonth };
}

export function generateSalaryReport(
  employees: Employee[],
  leads: Lead[],
  invoices: any[] = []
): SalaryReport[] {
  return employees.map(emp => {
    const { conversions, lastMonthSales, teamSales, isMonthOne } = derivePayrollContext(
      emp,
      leads,
      employees
    );

    const compensation = calculateMonthlyCompensation(
      conversions,
      isMonthOne,
      0, 
      lastMonthSales,
      teamSales
    );
    
    const empInvoices = invoices.filter(i => i.employeeId === emp.id);
    const latestInvoice = empInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      avatarUrl: emp.avatarUrl,
      panNumber: (emp as any).panNumber,
      aadhaarNumber: (emp as any).aadhaarNumber,
      invoiceId: latestInvoice ? latestInvoice.id : undefined,
      baseSalary: compensation.basePayout,
      conversions,
      commission:
        compensation.performanceBonus + compensation.milestoneBonus + compensation.leadershipBonus,
      grossPayout: compensation.grossPayout,
      tdsDeduction: compensation.tdsDeduction,
      totalPayout: compensation.totalPayout,
      target: isMonthOne && lastMonthSales < 5 ? 5 + (5 - lastMonthSales) : 5,
      willTerminate: compensation.willTerminate,
    };
  });
}
