import express from "express";
import { upsertProfile } from "../controllers/crmController.js";

const router = express.Router();

// Webhook endpoint for n8n/AI to update customer profile
router.post("/profile", upsertProfile);

export default router;
