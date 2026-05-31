import express from "express"; // Restart server trigger
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import sequelize from "./config/database.js";
import logger from "./utils/logger.js";
import { initMinio } from "./config/minio.js";

// Import Middleware Error Handler kita yang sudah canggih
import errorHandler from "./middlewares/errorMiddleware.js";

// Import Models/Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import handoverRoutes from "./routes/handoverRoutes.js";
import broadcastRoutes from "./routes/broadcastRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import { proxyMinioImage } from "./controllers/agentController.js";

// Models
import User from "./models/User.js";
import Agent from "./models/Agent.js";
import KnowledgeSource from "./models/KnowledgeSource.js";
import ConversationLog from "./models/ConversationLog.js";
import ConnectedPlatform from "./models/ConnectedPlatform.js";
import ChatHandover from "./models/ChatHandover.js";
import MetaMessage from "./models/MetaMessage.js";
import BroadcastTemplate from "./models/BroadcastTemplate.js";
import CustomerProfile from "./models/CustomerProfile.js";
import SystemLog from "./models/SystemLog.js"; // New model
import { startHandoverScheduler } from "./utils/handoverScheduler.js";
import { initCron } from "./services/cronService.js";

dotenv.config();

const app = express();

// --- Server Start & DB Connect ---
const PORT = process.env.PORT || 5000;

// --- Middlewares Global ---
app.use(helmet());

// UPDATE CORS: Agar Cookie bisa dikirim dari Frontend (Vite) ke Backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Sesuaikan dengan port Frontend Vite Anda
    credentials: true, // Wajib true agar cookie token bisa lewat
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// --- Base Route ---
app.get("/", (req, res) => {
  res.send({
    message: "API is Running...",
    status: "OK",
    version: "1.0.0",
  });
});

// --- Routes ---
// Proxy route for images (public)
app.get("/api/agents/knowledge/proxy-image", proxyMinioImage);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/handover", handoverRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/logs", logRoutes);

// --- Error Handling Middleware ---
// HAPUS blok app.use((err...)) yang lama (manual).
// GANTI dengan middleware modular kita.
// Ini akan menangkap AppError dari controller dan mengirim pesan yang benar (misal: "Password salah")
app.use(errorHandler);

// INIT MINIO
initMinio();

// RELASI DATABASE
// 1. User -> Agent
User.hasMany(Agent, { foreignKey: "userId", onDelete: "CASCADE" });
Agent.belongsTo(User, { foreignKey: "userId" });

// 2. Agent -> KnowledgeSource
Agent.hasMany(KnowledgeSource, { foreignKey: "agentId", onDelete: "CASCADE" });
KnowledgeSource.belongsTo(Agent, { foreignKey: "agentId" });

// 3. User -> ConnectedPlatform (BARU)
User.hasMany(ConnectedPlatform, { foreignKey: "userId", onDelete: "CASCADE" });
ConnectedPlatform.belongsTo(User, { foreignKey: "userId" });

// 4. Agent <-> ConnectedPlatform (One-to-One atau One-to-Many tergantung kebutuhan)
// Skenario: 1 Agent bisa dipakai di banyak nomor? Atau 1 Agent 1 Nomor?
// Untuk simplifikasi SaaS vlow.ai: 1 Platform punya 1 Active Agent.
Agent.hasMany(ConnectedPlatform, { foreignKey: "agentId" });
ConnectedPlatform.belongsTo(Agent, { foreignKey: "agentId" });

// 5. Agent -> ConversationLog
Agent.hasMany(ConversationLog, { foreignKey: "agentId", onDelete: "CASCADE" });
ConversationLog.belongsTo(Agent, { foreignKey: "agentId" });

// 6. ConnectedPlatform -> ConversationLog (optional)
ConnectedPlatform.hasMany(ConversationLog, { foreignKey: "platformId", onDelete: "SET NULL" });
ConversationLog.belongsTo(ConnectedPlatform, { foreignKey: "platformId" });

// 7. ChatHandover associations
Agent.hasMany(ChatHandover, { foreignKey: "agentId", onDelete: "CASCADE" });
ChatHandover.belongsTo(Agent, { foreignKey: "agentId" });
ConnectedPlatform.hasMany(ChatHandover, { foreignKey: "platformId", onDelete: "CASCADE" });
ChatHandover.belongsTo(ConnectedPlatform, { foreignKey: "platformId" });

// 8. ConnectedPlatform -> MetaMessage (Meta Cloud API message storage)
ConnectedPlatform.hasMany(MetaMessage, { foreignKey: "platformId", onDelete: "CASCADE" });
MetaMessage.belongsTo(ConnectedPlatform, { foreignKey: "platformId" });

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database Connected Successfully.");

    // Sync with extended timeout and retry
    let synced = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sequelize.query('SET statement_timeout = 60000;'); // 60 seconds
        await sequelize.sync({ alter: true });
        logger.info("Database Models Synced.");
        
        // --- INJECT TEST LOG ---
        try {
          const { logInfo } = await import("./utils/systemLogger.js");
          await logInfo("SYSTEM", "Backend Server berhasil dimulai dan sinkronisasi database selesai.", { 
            environment: process.env.NODE_ENV,
            port: PORT
          });
        } catch (e) {
          // Ignore
        }
        // -----------------------

        synced = true;
        break;
      } catch (syncErr) {
        logger.warn(`Sync attempt ${attempt}/3 failed: ${syncErr.message}`);
        if (attempt === 3) {
          logger.warn("All sync attempts failed — starting server anyway (tables likely already exist).");
        }
        await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
      }
    }

    // Fix: ensure agentId column is nullable for meta_cloud platforms
    try {
      await sequelize.query('SET statement_timeout = 30000;');
      await sequelize.query(`ALTER TABLE "ChatHandovers" ALTER COLUMN "agentId" DROP NOT NULL;`);
    } catch (e) {
      // Ignore if already nullable or table doesn't exist
    }

    // Start handover auto-release scheduler
    startHandoverScheduler();
    initCron();

    // Start auto-delete for system logs (older than 14 days)
    setInterval(async () => {
      try {
        const { Op } = await import('sequelize');
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const deletedRows = await SystemLog.destroy({
          where: {
            createdAt: {
              [Op.lt]: fourteenDaysAgo
            }
          }
        });
        
        if (deletedRows > 0) {
          logger.info(`[SystemLogger] Auto-deleted ${deletedRows} old logs (>14 days).`);
        }
      } catch (err) {
        logger.error(`[SystemLogger] Failed to auto-delete old logs: ${err.message}`);
      }
    }, 24 * 60 * 60 * 1000); // Run every 24 hours

    // Migrate existing WAHA sessions to use webhook proxy
    try {
      const { updateSessionWebhook } = await import("./services/wahaService.js");
      
      let internalIp = "172.17.0.1";
      try {
        const dns = await import("dns/promises");
        const res = await dns.lookup("vlow_server");
        if (res && res.address) internalIp = res.address;
      } catch (e) {
        console.warn("DNS lookup failed, fallback to", internalIp);
      }

      const backendBaseUrl = process.env.WAHA_WEBHOOK_PROXY_URL || `http://${internalIp}:5000`;
      
      if (backendBaseUrl) {
        let proxyUrl = `${backendBaseUrl}/api/webhooks/waha`;
        if (proxyUrl.includes("vlow_server")) proxyUrl = proxyUrl.replace("vlow_server", internalIp);
        const wahaPlatforms = await ConnectedPlatform.findAll({
          where: { provider: "waha", status: "WORKING" },
        });
        for (const p of wahaPlatforms) {
          await updateSessionWebhook(p.sessionId, proxyUrl);
        }
        if (wahaPlatforms.length > 0) {
          logger.info(`[Migration] Updated ${wahaPlatforms.length} WAHA session(s) webhook → proxy`);
        }
      }
    } catch (e) {
      logger.warn(`[Migration] WAHA webhook migration skipped: ${e.message}`);
    }

    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("FULL ERROR STARTING SERVER:", error);
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }

};

startServer();
