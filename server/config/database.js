import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import fs from "fs";

dotenv.config();

let dbHost = process.env.DB_HOST || "postgres";
console.log("DEBUG: process.env.DB_HOST =", process.env.DB_HOST);
console.log("DEBUG: process.env.NODE_ENV =", process.env.NODE_ENV);

// Force override if running in Docker and host is set to localhost
const isDocker = fs.existsSync("/.dockerenv");
if (isDocker && (dbHost === "localhost" || dbHost === "127.0.0.1" || dbHost === "::1")) {
  dbHost = "postgres";
}

// Local postgres container does not support SSL
if (dbHost === "postgres") {
  process.env.DB_SSL = "false";
}

console.log("DEBUG: final dbHost =", dbHost);
console.log("DEBUG: DB_SSL =", process.env.DB_SSL);

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
