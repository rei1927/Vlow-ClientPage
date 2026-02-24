import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  logConversation,
  getDashboardStats,
  getAdminDashboardStats,
  getUsageStats, // Tambahan: Import getUsageStats
} from "../controllers/analyticsController.js";

const router = express.Router();

// Public route untuk n8n webhook logging
router.post("/log", logConversation);

// Protected route untuk dashboard stats (customer)
router.get("/dashboard", protect, getDashboardStats);

// Protected route untuk usage stats (customer header limit counter)
router.get("/usage", protect, getUsageStats);

// Protected route untuk admin dashboard stats
router.get("/admin-dashboard", protect, getAdminDashboardStats);

export default router;
