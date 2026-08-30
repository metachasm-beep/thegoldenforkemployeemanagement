/**
 * Payroll Engine
 *
 * Separates two concerns that were previously entangled in actions.ts:
 * 1. derivePayrollContext — pure function: employee + leads → PayrollContext
 * 2. generateSalaryReport — thin orchestrator: fetch data → map through context → compensation
 *
 * derivePayrollContext is the testable seam. All complex date/relegation/squad
 * logic lives here and can be unit-tested without mocking the database.
 */

import { Employee, Lead, SalaryReport } from '@/types';
import { calculateMonthlyCompensation } from '@/lib/compensation';

export type PayrollContext = {
  conversions: number;
  lastMonthSales: number;
  teamSales: number;
  isMonthOne: boolean;
  joinedThisMonth: boolean;
};

/**
 * Pure function: derives all payroll-relevant context for one employee.
 * No I/O. Fully unit-testable.
 */
export function derivePayrollContext(
  emp: Employee,
  leads: Lead[],
  allEmployees: Employee[],
  now: Date = new Date()
): PayrollContext {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month conversions (monthly subscriptions only — status gate enforced at data entry)
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

  // If they joined this month, treat last month as full target (no carry-over debt)
  const lastMonthSales = joinedThisMonth
    ? 5
    : leads.filter(
        l =>
          l.employeeId === emp.id &&
          l.status === 'Converted' &&
          new Date(l.date).getMonth() === lastMonth &&
          new Date(l.date).getFullYear() === lastMonthYear
      ).length;

  // Squad sales — only applies to Team Leads
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

  // Probation status: within probation window OR auto-relegated from last month miss
  const probationEnd =
    new Date(emp.startDate || '').getTime() + emp.probationDuration * 30 * 24 * 60 * 60 * 1000;
  let isMonthOne = Date.now() < probationEnd;
  if (!isMonthOne && lastMonthSales < 5 && !joinedThisMonth) {
    isMonthOne = true; // Auto-relegation
  }

  return { conversions, lastMonthSales, teamSales, isMonthOne, joinedThisMonth };
}

/**
 * Generates the full salary report for all employees.
 * Thin orchestrator — all complex logic is in derivePayrollContext and compensation.ts.
 */
export function generateSalaryReport(
  employees: Employee[],
  leads: Lead[]
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
      0, // previousCumulativeSales
      lastMonthSales,
      teamSales
    );

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      baseSalary: compensation.basePayout,
      conversions,
      commission:
        compensation.performanceBonus + compensation.milestoneBonus + compensation.leadershipBonus,
      leadershipBonus: compensation.leadershipBonus,
      performanceBonus: compensation.performanceBonus,
      totalPayout: compensation.totalPayout,
      target: isMonthOne && lastMonthSales < 5 ? 5 + (5 - lastMonthSales) : 5,
      willTerminate: compensation.willTerminate,
    };
  });
}
