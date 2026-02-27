import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPlatform,
  getMyPlatforms,
  getPlatformQR,
  getPlatformStatus,
  deletePlatform,
  updatePlatform,
  connectMetaWhatsApp,
  subscribeWebhook,
} from "../controllers/platformController.js";

const router = express.Router();

router.use(protect);

router.post("/whatsapp/connect", connectMetaWhatsApp);

router.route("/").get(getMyPlatforms).post(createPlatform);

router.route("/:id").put(updatePlatform).delete(deletePlatform);

// Route khusus QR & Status
router.get("/:id/qr", getPlatformQR);
router.get("/:id/status", getPlatformStatus);

// Subscribe existing meta_cloud platform to webhook
router.post("/:id/subscribe-webhook", subscribeWebhook);

export default router;

