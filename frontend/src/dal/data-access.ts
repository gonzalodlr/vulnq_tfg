/** @format */

// Here is where the access to the database is defined, we only can access the database through this file and if we are authorized(authenticated)

// Normally a middleware is used to check if the user is authenticated, but in this case we are not using it because of the recent NextJS vulnerability which bypass the middleware and access the components directly

import "server-only"; // This is important to use server-side code in Next.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "password";
const dbCve = process.env.DB_CVE || "db_cve";
const dbCpe = process.env.DB_CPE || "db_cpe";
const dbCapec = process.env.DB_CAPEC || "db_capec";
const dbCwe = process.env.DB_CWE || "db_cwe";

const poolCVE = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbCve,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolCPE = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbCpe,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolCAPEC = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbCapec,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const poolCWE = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbCwe,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function queryDatabase(
  query: string,
  values: any[] = [],
  pool: mysql.Pool
) {
  const connection = await pool.getConnection(); // Obtener una conexión del pool

  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
}

export { poolCVE, poolCPE, poolCAPEC, poolCWE };
