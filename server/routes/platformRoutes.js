import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPlatform,
  getMyPlatforms,
  getPlatformQR,
  getPlatformStatus,
  deletePlatform,
  updatePlatform,
} from "../controllers/platformController.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getMyPlatforms).post(createPlatform);

router.route("/:id").put(updatePlatform).delete(deletePlatform);

// Route khusus QR & Status
router.get("/:id/qr", getPlatformQR);
router.get("/:id/status", getPlatformStatus);

export default router;
