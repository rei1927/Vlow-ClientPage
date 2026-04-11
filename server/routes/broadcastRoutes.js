import express from "express";
import multer from "multer";
import { getTemplates, syncTemplates, sendBroadcast, createTemplate, deleteTemplate } from "../controllers/broadcastController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/templates", getTemplates);
router.post("/templates", upload.single("mediaFile"), createTemplate);
router.delete("/templates/:id", deleteTemplate);
router.post("/templates/sync", syncTemplates);
router.post("/send", sendBroadcast);

export default router;
