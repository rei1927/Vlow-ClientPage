import express from "express";
import { getTemplates, syncTemplates, sendBroadcast } from "../controllers/broadcastController.js";

const router = express.Router();

router.get("/templates", getTemplates);
router.post("/templates/sync", syncTemplates);
router.post("/send", sendBroadcast);

export default router;
