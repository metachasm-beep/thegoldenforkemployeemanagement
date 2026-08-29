import { prisma } from '../src/lib/prisma';
import { getEmployees } from '../src/lib/db/employees';
import { getLeads } from '../src/lib/db/leads';
import { getExpenses, getPTO } from '../src/lib/db/approvals';
import { getSystemSettings } from '../src/lib/db/settings';

async function main() {
  console.log('Fetching legacy data from Google Sheets...');
  const [employees, leads, expenses, ptos, settings] = await Promise.all([
    getEmployees(),
    getLeads(),
    getExpenses(),
    getPTO(),
    getSystemSettings()
  ]);

  console.log(`Fetched ${employees.length} employees, ${leads.length} leads, ${expenses.length} expenses, ${ptos.length} ptos.`);

  console.log('Inserting Employees...');
  for (const emp of employees) {
    try {
      await prisma.employee.create({
        data: {
          id: String(emp.id),
          name: String(emp.name),
          role: String(emp.role),
          email: String(emp.email),
          password: String(emp.password),
          baseSalary: Number(emp.baseSalary) || 0,
          commissionRate: Number(emp.commissionRate) || 0,
          target: Number(emp.target) || 0,
          managerId: emp.managerId ? String(emp.managerId) : null,
          probationDuration: Number(emp.probationDuration) || 0,
          isProbation: Boolean(emp.isProbation),
          failedMonths: Number(emp.failedMonths) || 0,
          penalty: Number(emp.penalty) || 0,
        }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') console.error('Error inserting employee', emp.id, e);
    }
  }

  console.log('Inserting Leads...');
  for (const lead of leads) {
    try {
      await prisma.lead.create({
        data: {
          leadId: String(lead.leadId),
          employeeId: String(lead.employeeId),
          date: String(lead.date),
          status: String(lead.status),
          assignee: String(lead.assignee),
          followUp: String(lead.followUp),
          notes: String(lead.notes),
        }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') console.error('Error inserting lead', lead.leadId, e);
    }
  }

  console.log('Inserting Expenses...');
  for (const exp of expenses) {
    try {
      await prisma.expense.create({
        data: {
          expenseId: String(exp.expenseId),
          employeeId: String(exp.employeeId),
          date: String(exp.date),
          amount: Number(exp.amount) || 0,
          description: String(exp.description),
          status: String(exp.status),
        }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') console.error('Error inserting expense', exp.expenseId, e);
    }
  }

  console.log('Inserting PTOs...');
  for (const pto of ptos) {
    try {
      await prisma.pTO.create({
        data: {
          ptoId: String(pto.ptoId),
          employeeId: String(pto.employeeId),
          startDate: String(pto.startDate),
          endDate: String(pto.endDate),
          status: String(pto.status),
        }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') console.error('Error inserting pto', pto.ptoId, e);
    }
  }

  console.log('Inserting Settings...');
  for (const key in settings) {
    try {
      await prisma.setting.create({
        data: {
          key: String(key),
          value: String(settings[key]),
        }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') console.error('Error inserting setting', key, e);
    }
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
