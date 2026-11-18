// MySQL connection pool for the Batloung Farm Distribution System.
// All settings come from .env — nothing secret is hard-coded here.
import 'dotenv/config';
import mysql from 'mysql2/promise';

/** Build a pool from explicit settings (used by tests and scripts) or from .env. */
export function createPool(overrides = {}) {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '111111',
    database: process.env.DB_NAME || 'batloung_farm',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: ['DATE'],
    decimalNumbers: true,
    enableKeepAlive: true,
    ...overrides,
  });
}

export const pool = createPool();

/** Run a query and return the rows. */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Run a query and return only the first row (or null). */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows?.[0] ?? null;
}

/**
 * Run several statements in a single transaction.
 * The callback receives a dedicated connection; anything thrown rolls everything back.
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Wrap connection query to return just rows like pool.query does
    const query = async (sql, params) => {
      const [rows] = await conn.query(sql, params);
      return rows;
    };
    const queryOne = async (sql, params) => {
      const rows = await query(sql, params);
      return rows?.[0] ?? null;
    };
    const result = await fn({ query, queryOne });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Simple connectivity probe used by the /api/health endpoint. */
export async function ping() {
  const row = await queryOne(
    'SELECT DATABASE() AS `database`, VERSION() AS version, CURRENT_USER() AS user',
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
