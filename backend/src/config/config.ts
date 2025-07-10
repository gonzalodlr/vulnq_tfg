/** @format */

import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5002,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  IP_ADDRESS: process.env.IP_ADDRESS || "localhost",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  dbUrl: process.env.DATABASE_URL || "mysql://user:pass@localhost:3306/dbname",
  dbHost: process.env.DB_HOST || "localhost",
  dbUser: process.env.DB_USER || "usename",
  dbPassword: process.env.DB_PASSWORD || "password",
  dbName: process.env.DB_NAME || "db_name",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "access_secret",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "your-api-key-here",
};

/* export const config = {
  port: process.env.PORT || 5002,
  frontendUrl: process.env.FRONTEND_URL || "http://192.168.229.4:3000",
  IP_ADDRESS: process.env.IP_ADDRESS || "192.168.229.4",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  dbHost: process.env.DB_HOST || "localhost",
  dbUser: process.env.DB_USER || "usename",
  dbPassword: process.env.DB_PASSWORD || "password",
  dbName: process.env.DB_NAME || "db_name",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "access_secret",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "your-api-key-here",
}; */
