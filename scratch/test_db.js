const { Client } = require('pg');

const client = new Client({
    connectionString: "postgres://postgres:2qP5p36dFp@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require"
});

async function run() {
    await client.connect();
    const res = await client.query('SELECT id, recipient_username, message, whatsapp_status, retry_count, related_form_id FROM app_notification ORDER BY id DESC LIMIT 5');
    console.log("Recent App Notifications:");
    console.table(res.rows);
    await client.end();
}

run().catch(console.dir);
