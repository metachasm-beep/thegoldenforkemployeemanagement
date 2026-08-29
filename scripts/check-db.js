const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Z2m1QCuHqosd@ep-lucky-cherry-av5n4o7z-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  const res = await client.query('SELECT id, name, role, email FROM "Employee"');
  console.log("DATABASE EMPLOYEES:");
  console.table(res.rows);
  await client.end();
}

run().catch(console.error);
