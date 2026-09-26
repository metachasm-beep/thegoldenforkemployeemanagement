const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  const resultLead = await prisma.lead.deleteMany({
    where: { 
      OR: [
        { email: { contains: "test-duplicate" } },
        { email: { contains: "e2e@" } }
      ]
    }
  });
  console.log(`Deleted ${resultLead.count} mock leads.`);

  const resultEmp2 = await prisma.employee.deleteMany({
    where: { email: "e2e-invoice@example.com" }
  });
  console.log(`Deleted ${resultEmp2.count} e2e-invoice mock employees.`);
  
  process.exit(0);
}

cleanup().catch(console.error);
