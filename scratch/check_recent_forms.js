const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT form_id, student_id, current_status, assigned_deputy_warden, submitted_at FROM reduction_form ORDER BY form_id DESC LIMIT 5");
  console.log('Recent Forms:', res.rows);
  await client.end();
}

run().catch(console.error);
