import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'caruser',
  password: process.env.DB_PASSWORD || 'carpass',
  database: process.env.DB_NAME || 'car_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
});

// Retry until the database is ready (compose may start backend before db finishes init).
export async function waitForDb(retries = 30, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection established.');
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${retries}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to the database.');
}
