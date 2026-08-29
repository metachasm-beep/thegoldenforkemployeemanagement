const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Z2m1QCuHqosd@ep-lucky-cherry-av5n4o7z-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  
  // Update the seeded manager account to use the real Google email
  const res = await client.query(
    'UPDATE "Employee" SET email = $1 WHERE email = $2 OR role = $3', 
    ['metachasm@gmail.com', 'manager@goldenfork.com', 'Manager']
  );
  
  console.log(`Updated ${res.rowCount} manager accounts to metachasm@gmail.com`);
  await client.end();
}

run().catch(console.error);
