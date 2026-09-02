import { prisma } from './src/lib/prisma';
async function main() {
  const emps = await prisma.employee.findMany();
  console.log(emps.map(e => ({name: e.name, avatar: e.avatarUrl})));
  prisma.$disconnect();
}
main();
