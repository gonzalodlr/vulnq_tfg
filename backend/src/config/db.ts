/** @format */

import { createPool } from "mysql2/promise";
import { config } from "./config";
import { Sequelize } from "sequelize";

export const pool = createPool({
  host: config.dbHost,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const sequelize: Sequelize = new Sequelize(
  config.dbName,
  config.dbUser,
  config.dbPassword,
  {
    host: config.dbHost,
    dialect: "mysql",
    logging: false,
  }
);
