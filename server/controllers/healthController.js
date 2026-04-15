import sequelize from "../config/database.js";
import minioClient, { bucketName } from "../config/minio.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Helper: wrap a promise with a timeout so one slow service doesn't block the entire check
const withTimeout = (promise, ms = 5000) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
};

export const checkHealth = async (req, res, next) => {
  const healthData = {
    database: "DOWN",
    storage: "DOWN",
    email: "DOWN",
    status: "ERROR"
  };

  try {
    // Run all checks concurrently with independent timeouts (5s each)
    const [dbResult, minioResult, smtpResult] = await Promise.allSettled([

      // 1. Check Database
      withTimeout(sequelize.authenticate(), 5000)
        .then(() => "UP")
        .catch((err) => {
          console.error("Health Check - DB Error:", err.message);
          return "DOWN";
        }),

      // 2. Check Minio
      withTimeout(minioClient.bucketExists(bucketName), 5000)
        .then(() => "UP")
        .catch((err) => {
          console.error("Health Check - Minio Error:", err.message);
          return "DOWN";
        }),

      // 3. Check SMTP
      (async () => {
        if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
          return "NOT_CONFIGURED";
        }
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: Number(process.env.SMTP_PORT || 465) === 465,
            auth: {
              user: process.env.SMTP_EMAIL,
              pass: process.env.SMTP_PASSWORD,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
          });
          await withTimeout(transporter.verify(), 5000);
          return "UP";
        } catch (err) {
          console.error("Health Check - SMTP Error:", err.message);
          return "DOWN";
        }
      })(),
    ]);

    healthData.database = dbResult.value;
    healthData.storage = minioResult.value;
    healthData.email = smtpResult.value;

    // Overall status
    if (healthData.database === "UP") {
      healthData.status = "OK";
    }

    res.status(200).json(healthData);

  } catch (error) {
    next(error);
  }
};

// Check Webhook URL health
export const checkWebhook = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ status: "ERROR", message: "URL is required" });
    }

    try {
      // 10 second timeout for the webhook check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If we get any HTTP response (even 400, 404, 405, 500), it means the URL
      // successfully resolved and the server is actively responding.
      return res.status(200).json({ 
        status: "OK", 
        statusCode: response.status,
        statusText: response.statusText 
      });
    } catch (err) {
      if (err.name === 'AbortError') {
         return res.status(500).json({ status: "TIMEOUT", message: "Connection timed out" });
      }
      return res.status(500).json({ status: "ERROR", message: err.message });
    }
  } catch (error) {
    next(error);
  }
};
