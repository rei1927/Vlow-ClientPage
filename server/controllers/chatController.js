import ConnectedPlatform from "../models/ConnectedPlatform.js";
import AppError from "../utils/AppError.js";
import * as wahaService from "../services/wahaService.js";

// Helper: Cek Kepemilikan dan Status Platform
const getValidPlatform = async (platformId, userId) => {
    const platform = await ConnectedPlatform.findOne({
        where: { id: platformId, userId: userId },
    });

    if (!platform) {
        throw new AppError("Platform tidak ditemukan", 404);
    }

    if (platform.status !== "WORKING") {
        throw new AppError(
            "Platform belum terhubung dengan WhatsApp (Status: " + platform.status + ")",
            400
        );
    }

    return platform;
};

// @desc    Get Chat Meta (IsBusiness & Labels)
// @route   GET /api/chats/:platformId/meta
// @access  Private
export const getChatMeta = async (req, res, next) => {
    try {
        const { platformId } = req.params;
        const platform = await getValidPlatform(platformId, req.user.id);

        const me = await wahaService.getMe(platform.sessionId);
        const isBusiness = me?.isBusiness || false;

        let labels = [];
        if (isBusiness) {
            labels = await wahaService.getLabels(platform.sessionId);
        }

        res.status(200).json({
            success: true,
            isBusiness,
            labels
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get All Chats for a Platform
// @route   GET /api/chats/:platformId
// @access  Private
export const getChats = async (req, res, next) => {
    try {
        const { platformId } = req.params;
        const platform = await getValidPlatform(platformId, req.user.id);

        const chats = await wahaService.getChats(platform.sessionId);

        res.status(200).json({
            success: true,
            data: chats,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Messages for a specific chat
// @route   GET /api/chats/:platformId/:chatId/messages
// @access  Private
export const getMessages = async (req, res, next) => {
    try {
        const { platformId, chatId } = req.params;
        const platform = await getValidPlatform(platformId, req.user.id);

        // Limit pesannya agar frontend tidak berat
        const limit = Number(req.query.limit) || 50;

        const messages = await wahaService.getMessages(platform.sessionId, chatId, limit);

        res.status(200).json({
            success: true,
            data: messages,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send Text Message to a Chat
// @route   POST /api/chats/:platformId/:chatId/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
    try {
        const { platformId, chatId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === "") {
            return next(new AppError("Pesan tidak boleh kosong", 400));
        }

        const platform = await getValidPlatform(platformId, req.user.id);

        const result = await wahaService.sendTextMessage(platform.sessionId, chatId, text);

        res.status(200).json({
            success: true,
            message: "Pesan berhasil dikirim",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign/Remove Label to a Chat
// @route   POST /api/chats/:platformId/:chatId/labels
// @access  Private
export const assignLabel = async (req, res, next) => {
    try {
        const { platformId, chatId } = req.params;
        const { labelId, action } = req.body; // action: "add" | "remove"

        if (!labelId || !action) {
            return next(new AppError("Label ID dan aksi (add/remove) harus disertakan", 400));
        }

        const platform = await getValidPlatform(platformId, req.user.id);

        // Memanggil WAHA service untuk update label
        const result = await wahaService.updateChatLabels(platform.sessionId, chatId, labelId, action);

        res.status(200).json({
            success: true,
            message: `Label berhasil di-${action === 'add' ? 'tambahkan' : 'hapus'}`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
