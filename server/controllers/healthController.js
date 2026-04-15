import sequelize from "../config/database.js";
import minioClient, { bucketName } from "../config/minio.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const checkHealth = async (req, res, next) => {
  const healthData = {
    database: "DOWN",
    storage: "DOWN",
    email: "DOWN",
    status: "ERROR"
  };

  try {
    // 1. Check Database
    try {
      await sequelize.authenticate();
      healthData.database = "UP";
    } catch (dbErr) {
      console.error("Health Check - DB Error:", dbErr.message);
    }

    // 2. Check Minio
    try {
      await minioClient.bucketExists(bucketName);
      healthData.storage = "UP";
    } catch (minioErr) {
      console.error("Health Check - Minio Error:", minioErr.message);
    }

    // 3. Check SMTP
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_EMAIL) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 465,
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        await transporter.verify();
        healthData.email = "UP";
      } else {
        healthData.email = "NOT_CONFIGURED";
      }
    } catch (smtpErr) {
      console.error("Health Check - SMTP Error:", smtpErr.message);
    }

    // Overall status (Database is the most critical)
    if (healthData.database === "UP") {
      healthData.status = "OK"; 
    }

    res.status(200).json(healthData);

  } catch (error) {
    next(error);
  }
};
