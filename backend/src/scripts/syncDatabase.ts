/** @format */

import { sequelize } from "../config/db";
import { config } from "../config/config";
import { Sequelize } from "sequelize";
import "../models"; // <-- Import all models and associations

const syncModels = async () => {
  try {
    console.log("🔄 Syncing database...");

    // 1. Crear conexión temporal sin base de datos
    // const tempSequelize = new Sequelize(
    //   "", // No database
    //   config.dbUser,
    //   config.dbPassword,
    //   {
    //     host: config.dbHost,
    //     dialect: "mysql",
    //     logging: false,
    //   }
    // );

    // 2. Crear la base de datos si no existe
    // await tempSequelize.query(
    //   `CREATE DATABASE IF NOT EXISTS \`${config.dbName}\`;`
    // );
    // await tempSequelize.close();
    // console.log("Database created or already exists.");

    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // Sincronizar todos los modelos
    //await sequelize.sync({ force: true }); // Usa { force: true } solo en desarrollo para eliminar y recrear tablas
    await sequelize.sync({ alter: true }); // Usa {alter: true} en producción para realizar cambios en las tablas existentes
    console.log("✅ Database synced successfully");
  } catch (error) {
    console.error("Unable to synchronize the models:", error);
  }
};

export default syncModels;
