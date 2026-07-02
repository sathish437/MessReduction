const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require'
});

async function run() {
  await client.connect();
  await client.query("DELETE FROM reduction_form_history WHERE form_id IN (SELECT form_id FROM reduction_form WHERE student_id = 56)");
  await client.query("DELETE FROM app_notification WHERE related_form_id IN (SELECT form_id FROM reduction_form WHERE student_id = 56)");
  await client.query("DELETE FROM activity_log WHERE form_id IN (SELECT form_id FROM reduction_form WHERE student_id = 56)");
  const res = await client.query("DELETE FROM reduction_form WHERE student_id = 56");
  console.log(`Deleted ${res.rowCount} form(s) for student 56`);
  await client.end();
}

run().catch(console.error);
