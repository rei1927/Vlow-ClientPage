import express from "express";
import { checkHealth, checkWebhook } from "../controllers/healthController.js";

const router = express.Router();

router.get("/", checkHealth);
router.post("/check-webhook", checkWebhook);

export default router;
