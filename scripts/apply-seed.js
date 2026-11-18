import pg from 'pg';
import fs from 'fs';
const { Client } = pg;
const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_2QczyEVfNi5k@ep-still-cloud-bdj6dag9-pooler.c-8.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
const sql = fs.readFileSync('database/seed.pg.sql', 'utf8');
await client.query(sql);
console.log('Seed applied');
const tables = ['suppliers', 'fruits', 'vendors', 'users', 'purchases', 'purchase_details', 'sales', 'sale_details', 'payments', 'stock'];
for (const t of tables) {
  const r = await client.query('SELECT COUNT(*) AS n FROM ' + t);
  console.log('  ' + t.padEnd(18) + ' ' + r.rows[0].n);
}
await client.end();