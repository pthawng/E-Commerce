const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT COUNT(*) FROM products');
    console.log('Product count:', res.rows[0].count);
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  } finally {
    await client.end();
  }
}

main();
