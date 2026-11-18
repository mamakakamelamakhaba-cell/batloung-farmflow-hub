// PostgreSQL connection pool for the Batloung Farm Distribution System.
// Works with Neon, Supabase, Railway, or any PostgreSQL 14+.
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

/** Build a pool from explicit settings (used by tests and scripts) or from .env. */
export function createPool(overrides = {}) {
  // Use Neon's DATABASE_URL if available (preferred for Neon)
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  
  if (connectionString) {
    return new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_SIZE || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
      ...overrides,
    });
  }

  // Fallback to individual env vars (for local dev, Supabase, Railway, etc.)
  const isNeon = process.env.DB_HOST?.includes('neon.tech');
  const isSupabase = process.env.DB_HOST?.includes('supabase.co');
  
  // Neon and Supabase require SSL
  const ssl = (isNeon || isSupabase || process.env.DB_SSL === 'true') 
    ? { rejectUnauthorized: false } 
    : false;

  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'batloung_farm',
    max: Number(process.env.DB_POOL_SIZE || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl,
    ...overrides,
  });
}

export const pool = createPool();

/** Run a query and return the rows. */
export async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/** Run a query and return only the first row (or null). */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows?.[0] ?? null;
}

/**
 * Run several statements in a single transaction.
 * The callback receives a dedicated client; anything thrown rolls everything back.
 */
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = async (sql, params) => {
      const result = await client.query(sql, params);
      return result.rows;
    };
    const queryOne = async (sql, params) => {
      const rows = await query(sql, params);
      return rows?.[0] ?? null;
    };
    const result = await fn({ query, queryOne });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Simple connectivity probe used by the /api/health endpoint. */
export async function ping() {
  const row = await queryOne(
    'SELECT current_database() AS database, version(), current_user AS "user"'
  );
  const counts = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM suppliers) AS suppliers,
      (SELECT COUNT(*) FROM fruits)    AS fruits,
      (SELECT COUNT(*) FROM vendors)   AS vendors,
      (SELECT COUNT(*) FROM purchases) AS purchases,
      (SELECT COUNT(*) FROM sales)     AS sales,
      (SELECT COUNT(*) FROM stock)     AS stock
  `);
  return { ...row, counts };
}

export default pool;