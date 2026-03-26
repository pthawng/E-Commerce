const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: "postgres://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce"
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'InventoryItem'");
  const columns = res.rows.map(r => r.column_name);
  fs.writeFileSync('columns.txt', JSON.stringify(columns, null, 2));
  console.log('Columns:', columns);
  await client.end();
}

main().catch(err => {
  fs.writeFileSync('columns.txt', err.stack);
  console.error(err);
  process.exit(1);
});
