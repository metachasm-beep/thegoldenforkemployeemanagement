require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  const names = ['Alishna Panda', 'Siddhi Jain', 'Raushan Kumar'];
  
  for (const name of names) {
    const res = await client.query('UPDATE "Employee" SET "probationSalary" = 20000, "baseSalary" = 50000 WHERE name = $1 RETURNING *', [name]);
    console.log(`Updated ${name}: baseSalary=${res.rows[0].baseSalary}, probationSalary=${res.rows[0].probationSalary}`);
  }
  
  await client.end();
});
