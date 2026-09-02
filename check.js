const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.employee.findMany().then(emps => {
  console.log(emps.map(e => ({name: e.name, avatar: e.avatarUrl})));
  prisma.$disconnect();
});
