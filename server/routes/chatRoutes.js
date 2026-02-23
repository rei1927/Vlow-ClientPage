import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getChats,
    getChatMeta,
    getMessages,
    sendMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// Semua route di-protect (harus login)
router.use(protect);

router.get("/:platformId/meta", getChatMeta);
router.get("/:platformId", getChats);
router.get("/:platformId/:chatId/messages", getMessages);
router.post("/:platformId/:chatId/messages", sendMessage);

export default router;
