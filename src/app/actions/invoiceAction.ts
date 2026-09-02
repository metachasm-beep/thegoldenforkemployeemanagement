'use server';

import { prisma } from '@/lib/prisma';
import { derivePayrollContext } from '@/lib/payroll';
import { calculateMonthlyCompensation } from '@/lib/compensation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';

export async function generateAndStoreInvoice(employeeId: string, month: string) {
  try {
    const employees = await getEmployees();
    const leads = await getLeads();
    
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');

    const [year, monthNum] = month.split('-');
    const targetDate = new Date(parseInt(year), parseInt(monthNum) - 1, 15);

    const { conversions, lastMonthSales, teamSales, isMonthOne } = derivePayrollContext(
      emp,
      leads,
      employees,
      targetDate
    );

    const compensation = calculateMonthlyCompensation(
      emp.baseSalary,
      (emp as any).probationSalary || 15000,
      emp.target,
      emp.commissionRate,
      conversions,
      isMonthOne,
      0,
      lastMonthSales,
      teamSales
    );

    const totalCommission = compensation.performanceBonus + compensation.milestoneBonus + compensation.leadershipBonus;
    
    await prisma.invoice.create({
      data: {
        employeeId,
        month,
        conversions,
        baseSalary: compensation.basePayout,
        commission: totalCommission,
        grossAmount: compensation.grossPayout,
        tdsDeduction: compensation.tdsDeduction,
        amount: compensation.totalPayout,
        status: 'Generated'
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    return { success: false, error: error.message };
  }
}
