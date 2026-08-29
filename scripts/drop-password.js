const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Z2m1QCuHqosd@ep-lucky-cherry-av5n4o7z-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  await client.query('ALTER TABLE "Employee" DROP COLUMN "password";');
  await client.end();
  console.log('Column dropped successfully');
}
run().catch(console.error);
