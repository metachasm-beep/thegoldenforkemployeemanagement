import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';
import { derivePayrollContext } from '@/lib/payroll';
import { calculateMonthlyCompensation } from '@/lib/compensation';

export const maxDuration = 300; // 5 minutes (Vercel Pro)

export async function GET(request: Request) {
  try {
    // Basic authorization for the cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await getEmployees();
    const leads = await getLeads();
    
    // Determine the target month (e.g., if run on Sept 1, generate invoices for August)
    const now = new Date();
    let year = now.getFullYear();
    let monthNum = now.getMonth(); // 0-indexed. If Jan (0), this gives 0, which we handle below.
    
    if (monthNum === 0) {
      monthNum = 12;
      year -= 1;
    }
    const monthString = `${year}-${monthNum.toString().padStart(2, '0')}`;
    const targetDate = new Date(year, monthNum - 1, 15); // middle of the target month

    const results = [];
    
    for (const emp of employees) {
      // Check if invoice already exists
      const existing = await prisma.invoice.findFirst({
        where: { employeeId: emp.id, month: monthString }
      });
      
      if (existing) {
        results.push({ employeeId: emp.id, status: 'skipped', reason: 'already_exists' });
        continue;
      }

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
        0, // previous cumulative sales would require historical lead tracking, simplified here
        lastMonthSales,
        teamSales
      );

      const totalCommission = compensation.performanceBonus + compensation.milestoneBonus + compensation.leadershipBonus;
      
      await prisma.invoice.create({
        data: {
          employeeId: emp.id,
          month: monthString,
          conversions,
          baseSalary: compensation.basePayout,
          commission: totalCommission,
          grossAmount: compensation.grossPayout,
          tdsDeduction: compensation.tdsDeduction,
          amount: compensation.totalPayout,
          status: 'Generated'
        }
      });
      
      results.push({ employeeId: emp.id, status: 'success' });
    }

    return NextResponse.json({ success: true, month: monthString, results });
  } catch (error: any) {
    console.error('Cron Invoice Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
