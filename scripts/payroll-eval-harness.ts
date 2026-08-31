import { derivePayrollContext, generateSalaryReport } from '../src/lib/payroll';
import { Employee, Lead, Expense, PTO } from '../src/types';
import { randomUUID } from 'crypto';

// Utilities for random generation
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate a random date within the last year
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

function generateScenarios(count: number) {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  console.log(`🚀 Starting Multi-Dimensional Payroll Evaluation Harness...`);
  console.log(`Generating and evaluating ${count} edge-case scenarios.\n`);

  for (let i = 0; i < count; i++) {
    // 1. Generate Employee
    const isProbation = Math.random() > 0.5;
    const startDate = randomDate(oneYearAgo, now);
    
    const emp: Employee = {
      id: `EMP-${i}`,
      name: `Test Emp ${i}`,
      email: `emp${i}@test.com`,
      role: randChoice(['Employee', 'Manager']),
      department: 'Sales',
      baseSalary: randInt(2000, 15000), // Random base
      commissionRate: randInt(100, 1000), // Random commission per lead
      target: randInt(0, 50),
      probationDuration: randChoice([0, 1, 3, 6]),
      isProbation,
      failedMonths: isProbation ? randInt(0, 3) : 0,
      penalty: isProbation ? randInt(500, 2000) : 0,
      startDate: startDate,
    };

    // 2. Generate Leads (0 to 100)
    const leadsCount = randInt(0, 100);
    const leads: Lead[] = [];
    for (let j = 0; j < leadsCount; j++) {
      // 50% chance the lead is in the current month, 50% outside
      const leadDate = Math.random() > 0.5 
        ? new Date().toISOString().split('T')[0] // today
        : randomDate(oneYearAgo, now);
        
      leads.push({
        leadId: `LEAD-${i}-${j}`,
        employeeId: emp.id,
        assignee: `Client ${j}`,
        status: randChoice(['Converted', 'Lead Captured', 'Lost']),
        date: leadDate,
        followUp: leadDate,
        notes: ''
      });
    }

    // 3. Generate Expenses (0 to 10)
    const expensesCount = randInt(0, 10);
    const expenses: Expense[] = [];
    for (let j = 0; j < expensesCount; j++) {
      const expDate = Math.random() > 0.5 ? new Date().toISOString().split('T')[0] : randomDate(oneYearAgo, now);
      expenses.push({
        expenseId: `EXP-${i}-${j}`,
        employeeId: emp.id,
        amount: randInt(10, 1000),
        description: 'Test Expense',
        status: randChoice(['Approved', 'Pending', 'Rejected']),
        date: expDate
      });
    }

    // Evaluate the Engine
    try {
      const reports = generateSalaryReport([emp], leads, expenses, []);
      const report = reports[0];

      // INVARIANTS TO TEST:
      // 1. Total payout cannot be negative
      if (report.totalPayout < 0) throw new Error(`Negative total payout: ${report.totalPayout}`);
      // 2. Base salary is non-negative
      if (report.baseSalary < 0) throw new Error(`Negative base salary: ${report.baseSalary}`);
      // 3. Commission is non-negative
      if (report.commission < 0) throw new Error(`Negative commission: ${report.commission}`);
      // 4. If target not met and on probation, penalty should be applied (unless penalty logic has grace period)
      // We know derivePayrollContext handles grace period, so we check if penalty applied, it must not exceed base salary
      if (report.deductions > report.baseSalary) throw new Error(`Deductions (${report.deductions}) exceed base salary (${report.baseSalary})`);

      passed++;
    } catch (e: any) {
      failed++;
      if (failures.length < 10) {
        failures.push(`Scenario ${i} failed: ${e.message}\nEmployee: ${JSON.stringify(emp)}\n`);
      }
    }
  }

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\nSample Failures:\n${failures.join('\n')}`);
    process.exit(1);
  } else {
    console.log('\n🎉 All multi-dimensional invariants held strong!');
  }
}

generateScenarios(10000);
