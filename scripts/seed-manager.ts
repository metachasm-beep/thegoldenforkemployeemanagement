import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_Z2m1QCuHqosd@ep-lucky-cherry-av5n4o7z-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const managerEmail = 'manager@goldenfork.com';
  const managerPassword = 'password123';
  const hash = crypto.createHash('sha256').update(managerPassword).digest('hex');

  const exists = await prisma.employee.findUnique({
    where: { email: managerEmail }
  });

  if (!exists) {
    await prisma.employee.create({
      data: {
        name: 'System Manager',
        role: 'Manager',
        email: managerEmail,
        password: hash,
        startDate: new Date().toISOString().split('T')[0],
        baseSalary: 0,
        commissionRate: 0,
        target: 0,
        probationDuration: 0,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
      }
    });
    console.log('Manager account created successfully.');
  } else {
    console.log('Manager account already exists.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
