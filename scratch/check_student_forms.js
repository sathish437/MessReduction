const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT form_id, current_status, is_active FROM reduction_form WHERE student_id = 56");
  console.log('Forms for student 56:', res.rows);
  await client.end();
}

run().catch(console.error);
