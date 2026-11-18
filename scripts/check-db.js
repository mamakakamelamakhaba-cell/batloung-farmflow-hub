// Quick connectivity + row-count check for the MySQL database.
// Run with:  npm run db:check
import 'dotenv/config';
import { ping, pool } from '../config/db.js';

try {
  const info = await ping();
  console.log(`Connected to ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Database: ${info.database}   MySQL: ${info.version}`);
  console.log('\nRow counts:');
  for (const [table, n] of Object.entries(info.counts)) {
    console.log(`  ${table.padEnd(12)} ${n}`);
  }
  const missing = Object.entries(info.counts).filter(([, n]) => n < 5);
  if (missing.length) {
    console.log('\nSome tables have fewer than 5 rows — run: npm run db:init');
  } else {
    console.log('\nAll tables have at least 5 records.');
  }
} catch (err) {
  console.error('Connection failed:', err.code || err.message);
  if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
    console.error('The DB_HOST in .env does not resolve. Check your local MySQL is running.');
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
