import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '111111',
  multipleStatements: true,
  decimalNumbers: true,
  dateStrings: ['DATE'],
});

try {
  // Test basic query
  await conn.query('CREATE DATABASE IF NOT EXISTS test_db');
  await conn.query('USE test_db');
  await conn.query('CREATE TABLE test (id INT)');
  console.log('Basic queries work');
  
  // Test stored procedure
  const sp = `CREATE PROCEDURE test_sp()
BEGIN
  SELECT 1;
END$$`;
  
  await conn.query(sp);
  console.log('Stored procedure works');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.query('DROP DATABASE IF EXISTS test_db');
  await conn.end();
}