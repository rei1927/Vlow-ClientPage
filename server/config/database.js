import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "postgres", // Explicitly set for production
  logging: (msg) => logger.debug(msg),
  dialectOptions: process.env.DB_SSL === "true" ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
