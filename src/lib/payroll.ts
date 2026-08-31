import { Employee, Lead, SalaryReport } from '@/types';
import { calculateMonthlyCompensation } from '@/lib/compensation';

export type PayrollContext = {
  conversions: number;
  lastMonthSales: number;
  teamSales: number;
  isMonthOne: boolean;
  joinedThisMonth: boolean;
};

export function getEmployeeCycleDates(startDate: Date, now: Date) {
  let monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  
  let cycleStart = new Date(startDate.getTime());
  cycleStart.setMonth(cycleStart.getMonth() + monthsDiff);
  
  // If the calculated anniversary for this month hasn't happened yet, we are in the previous cycle
  if (cycleStart > now) {
    monthsDiff--;
    cycleStart = new Date(startDate.getTime());
    cycleStart.setMonth(cycleStart.getMonth() + monthsDiff);
  }
  
  const cycleEnd = new Date(cycleStart.getTime());
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  
  const lastCycleStart = new Date(cycleStart.getTime());
  lastCycleStart.setMonth(lastCycleStart.getMonth() - 1);
  
  return { 
    cycleStart, 
    cycleEnd, 
    lastCycleStart, 
    lastCycleEnd: cycleStart, 
    monthsSinceJoin: Math.max(0, monthsDiff) 
  };
}

export function derivePayrollContext(
  emp: Employee,
  leads: Lead[],
  allEmployees: Employee[],
  now: Date = new Date()
): PayrollContext {
  const empJoinDate = new Date(emp.startDate || Date.now());
  const { cycleStart, cycleEnd, lastCycleStart, lastCycleEnd, monthsSinceJoin } = getEmployeeCycleDates(empJoinDate, now);

  const joinedThisMonth = monthsSinceJoin === 0;

  const conversions = leads.filter(l => {
    const d = new Date(l.date);
    return l.employeeId === emp.id && l.status === 'Converted' && d >= cycleStart && d < cycleEnd;
  }).length;

  const lastMonthSales = joinedThisMonth
    ? 5 // Grace target for first month
    : leads.filter(l => {
        const d = new Date(l.date);
        return l.employeeId === emp.id && l.status === 'Converted' && d >= lastCycleStart && d < lastCycleEnd;
      }).length;

  let teamSales = 0;
  if (emp.role === 'Team Lead') {
    const squadIds = allEmployees
      .filter(e => e.managerId === emp.id)
      .map(e => e.id);
    teamSales = leads.filter(l => {
      const d = new Date(l.date);
      return squadIds.includes(l.employeeId) && l.status === 'Converted' && d >= cycleStart && d < cycleEnd;
    }).length;
  }

  // Probation logic
  let isMonthOne = monthsSinceJoin < (emp.probationDuration || 1);
  
  // Relegation logic: If they aren't on probation, but they failed their target last month, they fall back to probation rules
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
