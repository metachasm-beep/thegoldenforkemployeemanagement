const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const names = ['Alishna Panda', 'Siddhi Jain', 'Raushan Kumar'];
  
  for (const name of names) {
    const res = await client.query('UPDATE "Employee" SET "baseSalary" = 20000 WHERE name = $1 RETURNING *', [name]);
    console.log(`Updated ${name}: ${res.rowCount} records`);
  }
  
  await client.end();
}

main().catch(console.error);
