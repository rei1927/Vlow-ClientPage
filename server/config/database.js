import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

let dbHost = process.env.DB_HOST || "postgres";
// Force override if Portainer mistakenly injects localhost in production
if (process.env.NODE_ENV === "production" && (dbHost === "localhost" || dbHost === "127.0.0.1" || dbHost === "::1")) {
  dbHost = "postgres";
}

const sequelize = new Sequelize(
  process.env.DB_NAME || "vlow_db",
  process.env.DB_USER || "vlow",
  process.env.DB_PASS || "vlow_secret",
  {
  host: dbHost,
  dialect: "postgres", // Explicitly set for production
  logging: (msg) => logger.debug(msg),
  dialectOptions: {
    ...(process.env.DB_SSL === "true" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}),
    statement_timeout: 120000, // 120 seconds for sync/alter queries
    query_timeout: 120000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});

export default sequelize;
