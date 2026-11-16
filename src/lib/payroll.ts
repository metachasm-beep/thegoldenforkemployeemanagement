import { Employee, Lead, SalaryReport } from '@/types';
import {
  calculateMonthlyCompensation,
  calculatePartTimeMonthlyCompensation,
  getLeadNetAnnualRevenue,
  isLeadVerifiedDemo,
  PT_SALES_CONSTANTS,
} from '@/lib/compensation';

export type PayrollContext = {
  conversions: number;
  lastMonthSales: number;
  teamSales: number;
  isMonthOne: boolean;
  joinedThisMonth: boolean;
  verifiedDemos: number;
  netRevenueThisMonth: number;
  lastMonthNetRevenue: number;
  previousCumulativeNetRevenue: number;
  previousCumulativeSales: number;
};

export function getEmployeeCycleDates(startDate: Date, now: Date) {
  let monthsDiff =
    (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

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
    monthsSinceJoin: Math.max(0, monthsDiff),
  };
}

export function isPartTimeEmployee(emp: Employee): boolean {
  return (
    emp.role === 'Part-Time Sales Executive' ||
    emp.role.toLowerCase().includes('part-time') ||
    emp.role.toLowerCase().includes('part time') ||
    (emp.customFields as any)?.employmentType === 'Part-Time'
  );
}

export function derivePayrollContext(
  emp: Employee,
  leads: Lead[],
  allEmployees: Employee[],
  now: Date = new Date()
): PayrollContext {
  const empJoinDate = new Date(emp.startDate || Date.now());
  const { cycleStart, cycleEnd, lastCycleStart, lastCycleEnd, monthsSinceJoin } =
    getEmployeeCycleDates(empJoinDate, now);

  const joinedThisMonth = monthsSinceJoin === 0;
  const empLeads = leads.filter((l) => l.employeeId === emp.id);

  const convertedThisCycle = empLeads.filter((l) => {
    const d = l.convertedAt ? new Date(l.convertedAt) : new Date(l.date);
    return l.status === 'Converted' && d >= cycleStart && d < cycleEnd;
  });

  const conversions = convertedThisCycle.length;

  const convertedLastCycle = empLeads.filter((l) => {
    const d = l.convertedAt ? new Date(l.convertedAt) : new Date(l.date);
    return l.status === 'Converted' && d >= lastCycleStart && d < lastCycleEnd;
  });

  const lastMonthSales = joinedThisMonth ? 5 : convertedLastCycle.length;

  const convertedBeforeCycle = empLeads.filter((l) => {
    const d = l.convertedAt ? new Date(l.convertedAt) : new Date(l.date);
    return l.status === 'Converted' && d < cycleStart;
  });

  const previousCumulativeSales = convertedBeforeCycle.length;

  const netRevenueThisMonth = convertedThisCycle.reduce(
    (sum, l) => sum + getLeadNetAnnualRevenue(l),
    0
  );

  const lastMonthNetRevenue = joinedThisMonth
    ? PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET
    : convertedLastCycle.reduce((sum, l) => sum + getLeadNetAnnualRevenue(l), 0);

  const previousCumulativeNetRevenue = convertedBeforeCycle.reduce(
    (sum, l) => sum + getLeadNetAnnualRevenue(l),
    0
  );

  const verifiedDemos = empLeads.filter((l) => {
    const d = new Date(l.createdAt || l.date);
    return d >= cycleStart && d < cycleEnd && isLeadVerifiedDemo(l);
  }).length;

  let teamSales = 0;
  if (emp.role === 'Team Lead') {
    const squadIds = allEmployees.filter((e) => e.managerId === emp.id).map((e) => e.id);
    teamSales = leads.filter((l) => {
      const d = l.convertedAt ? new Date(l.convertedAt) : new Date(l.date);
      return (
        squadIds.includes(l.employeeId) &&
        l.status === 'Converted' &&
        d >= cycleStart &&
        d < cycleEnd
      );
    }).length;
  }

  const partTime = isPartTimeEmployee(emp);

  // Probation logic
  let isMonthOne = monthsSinceJoin < (emp.probationDuration || 1);

  // Full-time relegation logic: If they aren't on probation, but they failed their target last month, they fall back to probation rules
  if (!partTime && !isMonthOne && lastMonthSales < 5 && !joinedThisMonth) {
    isMonthOne = true;
  }

  return {
    conversions,
    lastMonthSales,
    teamSales,
    isMonthOne,
    joinedThisMonth,
    verifiedDemos,
    netRevenueThisMonth,
    lastMonthNetRevenue,
    previousCumulativeNetRevenue,
    previousCumulativeSales,
  };
}

export function generateSalaryReport(
  employees: Employee[],
  leads: Lead[],
  invoices: any[] = []
): SalaryReport[] {
  return employees.map((emp) => {
    const {
      conversions,
      lastMonthSales,
      teamSales,
      isMonthOne,
      joinedThisMonth,
      verifiedDemos,
      netRevenueThisMonth,
      lastMonthNetRevenue,
      previousCumulativeNetRevenue,
      previousCumulativeSales,
    } = derivePayrollContext(emp, leads, employees);

    const partTime = isPartTimeEmployee(emp);

    const empInvoices = invoices.filter((i) => i.employeeId === emp.id);
    const latestInvoice = empInvoices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (partTime) {
      const ptComp = calculatePartTimeMonthlyCompensation({
        empBaseSalary: emp.baseSalary || PT_SALES_CONSTANTS.MONTH_2_STANDARD_BASE,
        empProbationSalary: (emp as any).probationSalary || PT_SALES_CONSTANTS.MONTH_1_FIXED_FEE,
        netRevenueThisMonth,
        verifiedDemosThisMonth: verifiedDemos,
        isMonthOne,
        previousCumulativeNetRevenue,
        lastMonthNetRevenue,
        joinedThisMonth,
      });

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        isPartTime: true,
        avatarUrl: emp.avatarUrl,
        panNumber: (emp as any).panNumber,
        aadhaarNumber: (emp as any).aadhaarNumber,
        invoiceId: latestInvoice ? latestInvoice.id : undefined,
        baseSalary: ptComp.basePayout,
        conversions,
        leads: leads.filter((l) => l.employeeId === emp.id).length,
        verifiedDemos,
        demoQuota: PT_SALES_CONSTANTS.MONTHLY_DEMO_QUOTA,
        netRevenueThisMonth,
        netRevenueQuota: PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET,
        cumulativeNetRevenue: previousCumulativeNetRevenue + netRevenueThisMonth,
        tierStatusLabel: ptComp.tierStatusLabel,
        commission: ptComp.performanceBonus + ptComp.milestoneBonus,
        grossPayout: ptComp.grossPayout,
        tdsDeduction: ptComp.tdsDeduction,
        totalPayout: ptComp.totalPayout,
        target: emp.target || 5,
        willTerminate: ptComp.willTerminate,
      };
    }

    const compensation = calculateMonthlyCompensation(
      emp.baseSalary,
      (emp as any).probationSalary || 15000,
      emp.target,
      emp.commissionRate,
      conversions,
      isMonthOne,
      previousCumulativeSales,
      lastMonthSales,
      teamSales
    );

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      isPartTime: false,
      avatarUrl: emp.avatarUrl,
      panNumber: (emp as any).panNumber,
      aadhaarNumber: (emp as any).aadhaarNumber,
      invoiceId: latestInvoice ? latestInvoice.id : undefined,
      baseSalary: compensation.basePayout,
      conversions,
      leads: leads.filter((l) => l.employeeId === emp.id).length,
      verifiedDemos,
      netRevenueThisMonth,
      cumulativeNetRevenue: previousCumulativeNetRevenue + netRevenueThisMonth,
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
