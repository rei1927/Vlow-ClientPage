import express from "express";
import { verifyMetaWebhook, receiveMetaWebhook, receiveN8nWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Digunakan oleh Meta untuk memverifikasi URL ini sebagai Webhook yang sah
router.get("/meta", verifyMetaWebhook);

// Digunakan oleh Meta untuk mengirim payload JSON pesan masuk WhatsApp
router.post("/meta", receiveMetaWebhook);

// Digunakan oleh n8n untuk mengirim parameter/objek
router.post("/n8n", receiveN8nWebhook);

export default router;
