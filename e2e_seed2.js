const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.pto.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.employee.deleteMany();

  const manager = await prisma.employee.create({
    data: {
      id: 'EMP001',
      name: 'Alice Manager',
      email: 'alice@thegoldenfork.com',
      role: 'Manager',
      password: 'password',
      department: 'Sales',
    }
  });

  const emp = await prisma.employee.create({
    data: {
      id: 'EMP002',
      name: 'Bob Salesman',
      email: 'bob@thegoldenfork.com',
      role: 'Employee',
      password: 'password',
      department: 'Sales',
      managerId: manager.id,
      monthlyTarget: 10,
    }
  });

  for (let i = 0; i < 15; i++) {
    await prisma.lead.create({
      data: {
        assignee: `Lead Company ${i}`,
        date: new Date().toISOString().split('T')[0],
        status: i < 5 ? 'Converted' : i < 10 ? 'Pending Verification' : 'Lead Captured',
        employeeId: emp.id,
      }
    });
  }

  await prisma.expense.create({
    data: {
      amount: 1500,
      description: 'Client Lunch',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      employeeId: emp.id,
    }
  });

  await prisma.pto.create({
    data: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pending',
      employeeId: emp.id,
    }
  });
  console.log('Seeding complete.');
}
main().finally(() => prisma.$disconnect());
