require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  client.query('SELECT name, "baseSalary", "commissionRate", target FROM "Employee"').then(res => {
    console.log(res.rows);
    client.end();
  });
});
