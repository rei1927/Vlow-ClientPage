import ConnectedPlatform from "../models/ConnectedPlatform.js";
import Agent from "../models/Agent.js";
import ChatHandover from "../models/ChatHandover.js";
import AppError from "../utils/AppError.js";
import * as wahaService from "../services/wahaService.js";

// Helper: swap WA labels for dashboard reply
const swapLabelsForDashboard = async (sessionId, chatId, handoverConfig) => {
    try {
        const humanLabelId = handoverConfig.handoverLabelId;
        const aiLabelId = handoverConfig.aiLabelId;
        if (!humanLabelId) return;
        // Remove AI label if exists
        if (aiLabelId) {
            try { await wahaService.updateChatLabels(sessionId, chatId, aiLabelId, "remove"); } catch (e) { }
        }
        // Add Human label
        await wahaService.updateChatLabels(sessionId, chatId, humanLabelId, "add");
    } catch (e) {
        console.log("[Handover] Label swap failed:", e.message);
    }
};

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

        // Meta Cloud API platforms don't use WAHA
        if (platform.provider === 'meta_cloud') {
            return res.status(200).json({
                success: true,
                isBusiness: true,
                labels: []
            });
        }

        const me = await wahaService.getMe(platform.sessionId);
        let isBusiness = me?.isBusiness || false;

        let labels = [];

        const labelsData = await wahaService.getLabels(platform.sessionId);
        const actualLabels = Array.isArray(labelsData) ? labelsData : (labelsData && Array.isArray(labelsData.docs) ? labelsData.docs : null);

        if (actualLabels) {
            labels = actualLabels;
            isBusiness = true;

            await Promise.all(labels.map(async (lbl) => {
                const chatAssociations = await wahaService.getChatsByLabel(platform.sessionId, lbl.id);
                lbl.items = Array.isArray(chatAssociations) ? chatAssociations : [];
            }));
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

        // Meta Cloud API platforms don't use WAHA for chat history
        if (platform.provider === 'meta_cloud') {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

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

        // Auto-activate handover + label when admin sends from dashboard
        try {
            const agent = await Agent.findOne({ where: { id: platform.agentId } });
            if (agent) {
                const handoverConfig = agent.handoverConfig || {};
                if (handoverConfig.enabled) {
                    const autoReleaseMinutes = handoverConfig.autoReleaseMinutes || 30;

                    const [handover, created] = await ChatHandover.findOrCreate({
                        where: { chatId, sessionId: platform.sessionId },
                        defaults: {
                            platformId: platform.id,
                            agentId: agent.id,
                            status: "human",
                            triggeredBy: "dashboard_reply",
                            activatedAt: new Date(),
                            autoReleaseAt: new Date(Date.now() + autoReleaseMinutes * 60 * 1000),
                            releasedAt: null,
                        },
                    });

                    if (!created) {
                        handover.status = "human";
                        handover.triggeredBy = "dashboard_reply";
                        handover.activatedAt = new Date();
                        handover.autoReleaseAt = new Date(Date.now() + autoReleaseMinutes * 60 * 1000);
                        handover.releasedAt = null;
                        await handover.save();
                    }

                    // Apply human label
                    await swapLabelsForDashboard(platform.sessionId, chatId, handoverConfig);
                    console.log("[Handover] Dashboard reply → handover activated for", chatId);
                }
            }
        } catch (handoverErr) {
            console.log("[Handover] Dashboard auto-activate error:", handoverErr.message);
        }

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
