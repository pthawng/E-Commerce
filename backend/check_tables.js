const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: "postgres://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce"
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
  const tables = res.rows.map(r => r.tablename);
  fs.writeFileSync('tables.txt', JSON.stringify(tables, null, 2));
  console.log('Tables:', tables);
  await client.end();
}

main().catch(err => {
  fs.writeFileSync('tables.txt', err.stack);
  console.error(err);
  process.exit(1);
});
