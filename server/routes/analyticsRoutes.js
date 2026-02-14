import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  logConversation,
  getDashboardStats,
  getAdminDashboardStats,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Public route untuk n8n webhook logging
router.post("/log", logConversation);

// Protected route untuk dashboard stats (customer)
router.get("/dashboard", protect, getDashboardStats);

// Protected route untuk admin dashboard stats
router.get("/admin-dashboard", protect, getAdminDashboardStats);

export default router;
