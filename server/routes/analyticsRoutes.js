import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  logConversation,
  getDashboardStats,
  getAdminDashboardStats,
  getUsageStats,
  debugLogs, // TEMPORARY: Debug endpoint
} from "../controllers/analyticsController.js";

const router = express.Router();

// Public route untuk n8n webhook logging
router.post("/log", logConversation);

// TEMPORARY: Debug endpoint to check logs
router.get("/debug-logs", debugLogs);

// Protected route untuk dashboard stats (customer)
router.get("/dashboard", protect, getDashboardStats);

// Protected route untuk usage stats (customer header limit counter)
router.get("/usage", protect, getUsageStats);

// Protected route untuk admin dashboard stats
router.get("/admin-dashboard", protect, getAdminDashboardStats);

export default router;
