// Creates every table and loads the sample data into your MySQL database.
// Run with:  npm run db:init
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const schemas = ['database/schema.sql', 'database/seed.sql'];

// First connect without database to create it
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '111111',
  multipleStatements: true,
  decimalNumbers: true,
  dateStrings: ['DATE'],
});

console.log(`Connected to ${process.env.DB_HOST || 'localhost'}`);

try {
  for (const rel of schemas) {
    const file = path.join(root, rel);
    const sql = fs.readFileSync(file, 'utf8');
    
    // Remove comment lines and split by semicolon
    const lines = sql.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    });
    const cleanedSql = filteredLines.join('\n');
    const statements = cleanedSql.split(';').map(s => s.trim()).filter(s => s);
    
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log(`✓ applied ${rel}`);
  }

  // Now connect to the created database to verify
  const dbConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '111111',
    database: process.env.DB_NAME || 'batloung_farm',
    decimalNumbers: true,
    dateStrings: ['DATE'],
  });

  const tables = ['suppliers', 'fruits', 'vendors', 'users', 'purchases', 'purchase_details', 'sales', 'sale_details', 'payments', 'stock'];
  console.log('\nRow counts:');
  for (const t of tables) {
    const [rows] = await dbConn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
    console.log(`  ${t.padEnd(18)} ${rows[0].n}`);
  }
  await dbConn.end();
  console.log('\nDatabase is ready.');
} catch (err) {
  console.error('\nDatabase setup failed:', err.message);
  if (/Access denied/i.test(err.message)) {
    console.error('Check DB_USER and DB_PASSWORD in .env.');
  }
  process.exitCode = 1;
} finally {
  await conn.end();
}