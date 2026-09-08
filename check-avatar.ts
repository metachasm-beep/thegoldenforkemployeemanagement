import { prisma } from './src/lib/prisma';
async function run() {
  const emp = await prisma.employee.findFirst();
  console.log(emp?.avatarUrl);
}
run().then(() => prisma.$disconnect());
