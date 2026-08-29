import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Z2m1QCuHqosd@ep-lucky-cherry-av5n4o7z-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  await client.connect();

  const managerEmail = 'manager@goldenfork.com';
  const managerPassword = 'password123';
  const hash = crypto.createHash('sha256').update(managerPassword).digest('hex');

  // Check if exists
  const res = await client.query('SELECT id FROM "Employee" WHERE email = $1', [managerEmail]);
  if (res.rows.length === 0) {
    const id = crypto.randomUUID();
    const startDate = new Date().toISOString().split('T')[0];
    await client.query(
      `INSERT INTO "Employee" (id, name, role, email, "startDate", "baseSalary", "commissionRate", target, "isProbation", "failedMonths", penalty, "probationDuration")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, 'System Manager', 'Manager', managerEmail, startDate, 0, 0, 0, false, 0, 0, 0]
    );
    console.log('Manager account created successfully.');
  } else {
    console.log('Manager account already exists.');
  }

  await client.end();
}

main().catch(console.error);
