require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  await client.query("UPDATE \"Lead\" SET status = 'Lead Captured' WHERE status IN ('Pending', 'Contacted', 'Meeting Scheduled')");
  console.log("Fixed old leads");
  await client.end();
});
