import { prisma } from './src/lib/prisma';
async function run() {
  const emps = await prisma.employee.findMany({ select: { name: true, email: true, role: true } });
  console.log(emps);
}
run().then(() => prisma.$disconnect());
