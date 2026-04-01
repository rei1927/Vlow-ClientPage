import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    activateHandover,
    releaseHandover,
    getHandoverStatus,
    getBatchHandoverStatus,
    checkKeyword,
    autoReleaseExpired,
} from "../controllers/handoverController.js";

const router = express.Router();

// Dashboard endpoints (protected)
router.post("/activate", protect, activateHandover);
router.post("/release", protect, releaseHandover);
router.get("/batch-status", protect, getBatchHandoverStatus);

// n8n integration endpoints (public — called from n8n workflow)
router.post("/activate-n8n", activateHandover); // Public route for n8n escalation
router.get("/status/:chatId", getHandoverStatus);
router.post("/check-keyword", checkKeyword);

// Manual trigger for auto-release (can also be called via cron)
router.post("/auto-release", async (req, res) => {
    const count = await autoReleaseExpired();
    res.json({ success: true, released: count });
});

export default router;
