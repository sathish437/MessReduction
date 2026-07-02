const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("UPDATE staff_users SET phone_no = '+917708988616'");
  console.log(`Updated ${res.rowCount} staff accounts`);
  await client.end();
}

run().catch(console.error);
