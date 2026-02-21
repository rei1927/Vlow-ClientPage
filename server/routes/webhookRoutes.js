import express from "express";
import { verifyMetaWebhook, receiveMetaWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Digunakan oleh Meta untuk memverifikasi URL ini sebagai Webhook yang sah
router.get("/meta", verifyMetaWebhook);

// Digunakan oleh Meta untuk mengirim payload JSON pesan masuk WhatsApp
router.post("/meta", receiveMetaWebhook);

export default router;
