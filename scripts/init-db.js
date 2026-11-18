// Creates every table and loads the sample data into your PostgreSQL database.
// Run with:  npm run db:init
import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const schemas = ['database/schema.pg.sql', 'database/seed.pg.sql'];

// Use Neon's DATABASE_URL if available
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
const ssl = connectionString ? { rejectUnauthorized: false } : false;

console.log(`Using database: ${connectionString ? 'Neon (DATABASE_URL)' : 'Local PostgreSQL'}`);

// First connect without database to create it (if needed)
const conn = new pg.Client({
  connectionString: connectionString?.replace(/\/[^/]+(\?|$)/, '/postgres$1') || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres',
  ssl,
});

console.log(`Connected to ${connectionString ? 'Neon' : (process.env.DB_HOST || 'localhost')}`);

try {
  await conn.connect();
  
  // Create database if it doesn't exist (for local PostgreSQL)
  if (!connectionString) {
    const dbName = process.env.DB_NAME || 'batloung_farm';
    await conn.query(`CREATE DATABASE ${dbName}`).catch(() => {});
    console.log(`Database ${dbName} ready`);
  }
  await conn.end();

  // Now connect to the created database
  const dbConn = new pg.Client({
    connectionString: connectionString || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'batloung_farm',
    ssl,
  });

  await dbConn.connect();

  for (const rel of schemas) {
    const file = path.join(root, rel);
    const sql = fs.readFileSync(file, 'utf8');
    
    // Execute the entire SQL file at once (handles dollar-quoted strings correctly)
    await dbConn.query(sql);
    console.log(`✓ applied ${rel}`);
  }

  const tables = ['suppliers', 'fruits', 'vendors', 'users', 'purchases', 'purchase_details', 'sales', 'sale_details', 'payments', 'stock'];
  console.log('\nRow counts:');
  for (const t of tables) {
    const result = await dbConn.query(`SELECT COUNT(*) AS n FROM ${t}`);
    console.log(`  ${t.padEnd(18)} ${result.rows[0].n}`);
  }
  
  await dbConn.end();
  console.log('\nDatabase is ready.');
} catch (err) {
  console.error('\nDatabase setup failed:', err.message);
  if (/password authentication failed/i.test(err.message)) {
    console.error('Check DB_USER and DB_PASSWORD in .env.');
  }
  if (/database .* does not exist/i.test(err.message)) {
    console.error('Check DB_NAME in .env.');
  }
  process.exitCode = 1;
}