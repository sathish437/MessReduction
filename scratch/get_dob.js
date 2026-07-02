const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT dob FROM student_details WHERE email_id = 'chikkouser@gmail.com'");
  console.log('DOB:', res.rows[0].dob);
  await client.end();
}

run().catch(console.error);
