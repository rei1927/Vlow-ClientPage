import ChatHandover from "../models/ChatHandover.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import Agent from "../models/Agent.js";
import AppError from "../utils/AppError.js";
import * as wahaService from "../services/wahaService.js";
import * as metaService from "../services/metaService.js";
import { Op } from "sequelize";

// Helper: swap WA labels for handover
const swapLabels = async (sessionId, chatId, handoverConfig, newStatus) => {
    try {
        const { handoverLabelId, aiLabelId } = handoverConfig || {};

        if (newStatus === "human") {
            // Add human label, remove AI label
            if (handoverLabelId) {
                await wahaService.updateChatLabels(sessionId, chatId, String(handoverLabelId), "add");
            }
            if (aiLabelId) {
                await wahaService.updateChatLabels(sessionId, chatId, String(aiLabelId), "remove");
            }
        } else {
            // Add AI label, remove human label
            if (aiLabelId) {
                await wahaService.updateChatLabels(sessionId, chatId, String(aiLabelId), "add");
            }
            if (handoverLabelId) {
                await wahaService.updateChatLabels(sessionId, chatId, String(handoverLabelId), "remove");
            }
        }
    } catch (error) {
        console.error("[Handover] Label swap error:", error.message);
        // Don't throw — label swap is best-effort
    }
};

// @desc    Activate handover (manual or auto)
// @route   POST /api/handover/activate
// @access  Private (dashboard) or Internal (n8n)
export const activateHandover = async (req, res, next) => {
    try {
        const { chatId, sessionId, triggeredBy, triggerKeyword } = req.body;

        if (!chatId || !sessionId) {
            return next(new AppError("chatId and sessionId are required", 400));
        }

        // Find the platform and agent
        const platform = await ConnectedPlatform.findOne({
            where: { sessionId },
            include: [{ model: Agent }],
        });

        if (!platform) {
            return next(new AppError("Platform not found for this session", 404));
        }

        const agent = platform.Agent;
        const handoverConfig = agent?.handoverConfig || {};
        const autoReleaseMinutes = handoverConfig.autoReleaseMinutes || 30;

        // Upsert: find existing or create new
        let [handover, created] = await ChatHandover.findOrCreate({
            where: { chatId, sessionId },
            defaults: {
                platformId: platform.id,
                agentId: agent?.id || null,
                status: "human",
                triggeredBy: triggeredBy || "manual",
                triggerKeyword: triggerKeyword || null,
                activatedAt: new Date(),
                autoReleaseAt: new Date(Date.now() + autoReleaseMinutes * 60 * 1000),
                releasedAt: null,
            },
        });

        if (!created) {
            // Update existing record
            handover.status = "human";
            handover.triggeredBy = triggeredBy || "manual";
            handover.triggerKeyword = triggerKeyword || null;
            handover.activatedAt = new Date();
            handover.autoReleaseAt = new Date(Date.now() + autoReleaseMinutes * 60 * 1000);
            handover.releasedAt = null;
            await handover.save();
        }

        // Swap WA labels (WAHA only)
        if (platform.provider !== "meta_cloud") {
            await swapLabels(sessionId, chatId, handoverConfig, "human");
        }

        // If there's a response message and triggered by keyword/ai, send it
        if (
            handoverConfig.responseMessage &&
            (triggeredBy === "auto_keyword" || triggeredBy === "ai_escalate")
        ) {
            try {
                if (platform.provider === "meta_cloud") {
                    await metaService.sendCloudMessage(
                        platform.phoneNumberId,
                        platform.systemUserAccessToken,
                        chatId,
                        handoverConfig.responseMessage
                    );
                } else {
                    await wahaService.sendTextMessage(sessionId, chatId, handoverConfig.responseMessage);
                }
            } catch (e) {
                console.error("[Handover] Failed to send response message:", e.message);
            }
        }

        res.status(200).json({
            success: true,
            message: "Handover activated — chat is now handled by human",
            data: handover,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Release handover (back to AI)
// @route   POST /api/handover/release
// @access  Private
export const releaseHandover = async (req, res, next) => {
    try {
        const { chatId, sessionId } = req.body;

        if (!chatId || !sessionId) {
            return next(new AppError("chatId and sessionId are required", 400));
        }

        const handover = await ChatHandover.findOne({
            where: { chatId, sessionId, status: "human" },
        });

        if (!handover) {
            return next(new AppError("No active handover found for this chat", 404));
        }

        // Find agent for label config
        const platform = await ConnectedPlatform.findOne({
            where: { sessionId },
            include: [{ model: Agent }],
        });

        handover.status = "ai";
        handover.releasedAt = new Date();
        handover.autoReleaseAt = null;
        await handover.save();

        // Swap labels back (WAHA only)
        if (platform?.Agent && platform.provider !== "meta_cloud") {
            await swapLabels(sessionId, chatId, platform.Agent.handoverConfig, "ai");
        }

        res.status(200).json({
            success: true,
            message: "Handover released — chat is now back to AI",
            data: handover,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get handover status for a chat
// @route   GET /api/handover/status/:chatId
// @access  Public (called by n8n)
export const getHandoverStatus = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const { sessionId } = req.query;

        if (!chatId) {
            return res.status(400).json({ status: "ai", message: "chatId required" });
        }

        const where = { chatId };
        if (sessionId) where.sessionId = sessionId;

        const handover = await ChatHandover.findOne({
            where,
            order: [["updatedAt", "DESC"]],
        });

        if (!handover || handover.status === "ai") {
            return res.status(200).json({
                status: "ai",
                handover: null,
            });
        }

        res.status(200).json({
            status: handover.status,
            handover: {
                triggeredBy: handover.triggeredBy,
                triggerKeyword: handover.triggerKeyword,
                activatedAt: handover.activatedAt,
                autoReleaseAt: handover.autoReleaseAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get batch handover statuses for all chats in a session
// @route   GET /api/handover/batch-status
// @access  Private
export const getBatchHandoverStatus = async (req, res, next) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ statuses: {} });
        }

        const handovers = await ChatHandover.findAll({
            where: { sessionId, status: "human" },
        });

        const statuses = {};
        for (const h of handovers) {
            statuses[h.chatId] = "human";
        }

        res.status(200).json({ statuses });
    } catch (error) {
        next(error);
    }
};

// @desc    Check if incoming message matches handover keywords
// @route   POST /api/handover/check-keyword
// @access  Public (called by n8n)
export const checkKeyword = async (req, res, next) => {
    try {
        const { chatId, sessionId, message } = req.body;

        if (!message || !sessionId) {
            return res.status(200).json({ matched: false });
        }

        // Find agent config
        const platform = await ConnectedPlatform.findOne({
            where: { sessionId },
            include: [{ model: Agent }],
        });

        if (!platform?.Agent) {
            return res.status(200).json({ matched: false });
        }

        const handoverConfig = platform.Agent.handoverConfig || {};

        if (!handoverConfig.enabled || !Array.isArray(handoverConfig.keywords) || handoverConfig.keywords.length === 0) {
            return res.status(200).json({ matched: false });
        }

        // Check if message contains any keyword (case-insensitive)
        const lowerMessage = message.toLowerCase();
        const matchedKeyword = handoverConfig.keywords.find((kw) =>
            lowerMessage.includes(kw.toLowerCase())
        );

        if (matchedKeyword) {
            // Auto-activate handover
            req.body = {
                chatId,
                sessionId,
                triggeredBy: "auto_keyword",
                triggerKeyword: matchedKeyword,
            };
            return activateHandover(req, res, next);
        }

        res.status(200).json({ matched: false });
    } catch (error) {
        next(error);
    }
};

// @desc    Auto-release expired handovers
// @route   POST /api/handover/auto-release (or called by scheduler)
// @access  Internal
export const autoReleaseExpired = async () => {
    try {
        const expired = await ChatHandover.findAll({
            where: {
                status: "human",
                autoReleaseAt: {
                    [Op.lte]: new Date(),
                },
            },
        });

        for (const handover of expired) {
            // Find agent for label config
            const platform = await ConnectedPlatform.findOne({
                where: { sessionId: handover.sessionId },
                include: [{ model: Agent }],
            });

            handover.status = "ai";
            handover.releasedAt = new Date();
            handover.autoReleaseAt = null;
            await handover.save();

            // Swap labels back
            if (platform?.Agent) {
                await swapLabels(handover.sessionId, handover.chatId, platform.Agent.handoverConfig, "ai");
            }

            console.log(`[Handover] Auto-released chat ${handover.chatId} back to AI`);
        }

        return expired.length;
    } catch (error) {
        console.error("[Handover] Auto-release error:", error.message);
        return 0;
    }
};

// @desc    Update lead temperature (Smart Lead Qualification)
// @route   POST /api/handover/lead-qualification
// @access  Public (called by n8n)
export const updateLeadTemperature = async (req, res, next) => {
    try {
        const { chatId, sessionId, temperature } = req.body;
        
        if (!chatId || !sessionId || !temperature) {
            return res.status(200).json({ success: false, message: "Missing required fields for lead qualification" });
        }

        const platform = await ConnectedPlatform.findOne({
            where: { sessionId },
            include: [{ model: Agent }],
        });

        if (!platform?.Agent) {
            return res.status(200).json({ success: false, message: "Platform/Agent not found" });
        }

        const leadConfig = platform.Agent.leadQualificationConfig || {};
        if (!leadConfig.enabled) {
            return res.status(200).json({ success: true, message: "Lead qualification disabled" });
        }

        const tempUpper = temperature.toUpperCase();
        let targetLabelId = null;

        if (tempUpper === "HOT") targetLabelId = leadConfig.hotLabelId;
        else if (tempUpper === "WARM") targetLabelId = leadConfig.warmLabelId;
        else if (tempUpper === "COLD") targetLabelId = leadConfig.coldLabelId;

        if (!targetLabelId) {
             return res.status(200).json({ success: true, message: `No label configured for temperature: ${tempUpper}` });
        }

        // Add the target label, and remove the other two if they exist.
        const labelsToRemove = [leadConfig.coldLabelId, leadConfig.warmLabelId, leadConfig.hotLabelId]
            .filter(id => id && id !== targetLabelId);
            
        // Remove old labels
        for (const labelId of labelsToRemove) {
             try { await wahaService.updateChatLabels(sessionId, chatId, String(labelId), "remove"); } catch(e) {}
        }
        
        // Add new label
        try { await wahaService.updateChatLabels(sessionId, chatId, String(targetLabelId), "add"); } catch(e) {}

        console.log(`🌡️ [Smart Lead] Chat ${chatId} updated to ${tempUpper}`);

        // If HOT, trigger handover!
        if (tempUpper === "HOT") {
             console.log(`🔥 [Smart Lead] Chat ${chatId} is HOT! Triggering Handover.`);
             req.body.triggeredBy = "ai_lead_hot";
             // Optional: Set responseMessage to notify user
             return activateHandover(req, res, next);
        }

        return res.status(200).json({ success: true, message: "Lead temperature updated" });
    } catch (error) {
        next(error);
    }
};
