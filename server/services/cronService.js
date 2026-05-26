import cron from 'node-cron';
import { Sequelize } from 'sequelize';
import { GoogleGenAI } from '@google/genai';
import Agent from '../models/Agent.js';
import ConnectedPlatform from '../models/ConnectedPlatform.js';
import ConversationLog from '../models/ConversationLog.js';
import { sendTextMessage } from './wahaService.js';
import { sendCloudMessage } from './metaService.js';
import axios from 'axios';

const WAHA_URL = process.env.WAHA_BASE_URL || "http://localhost:7575";
const HEADERS = {
  "Content-Type": "application/json",
  ...(process.env.WAHA_API_KEY && { "X-Api-Key": process.env.WAHA_API_KEY }),
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' });

async function getChatLabels(sessionId, chatId) {
    try {
        const encodedChatId = encodeURIComponent(chatId);
        const getRes = await axios.get(`${WAHA_URL}/api/${sessionId}/labels/chats/${encodedChatId}/`, { headers: HEADERS });
        return getRes.data || [];
    } catch (e) {
        console.error(`Error fetching labels for chat ${chatId}:`, e.message);
        return [];
    }
}

async function checkAndSendFollowups() {
    console.log("[CRON] Running Follow-up Check...");
    try {
        // 1. Get all agents that have followup enabled
        const agents = await Agent.findAll();
        for (const agent of agents) {
            let config = agent.followupConfig;
            if (typeof config === 'string') {
                try { config = JSON.parse(config); } catch(e) { config = {}; }
            }
            if (!config || !config.enabled) continue;

            // 2. Find active platforms for this agent
            const platforms = await ConnectedPlatform.findAll({ where: { agentId: agent.id, status: 'WORKING' } });
            if (platforms.length === 0) continue;

            const delayMinutes = config.delay || 15;
            const targetLabels = config.targetLabels || []; // array of string IDs
            const maxCount = config.maxCount || 1;
            const maxPeriod = config.maxPeriod || 24;
            const maxPeriodUnit = config.maxPeriodUnit || 'hours';

            // 3. Find chats that might need followup
            // We find the LATEST message for each chat
            // In Postgres, we can do this via DISTINCT ON or a Group By.
            // But since we use Sequelize, raw query is easiest.
            const query = `
                WITH RankedLogs AS (
                    SELECT 
                        id, "chatId", "sessionId", "userMessage", "aiResponse", "createdAt", "metadata",
                        ROW_NUMBER() OVER(PARTITION BY "chatId", "sessionId" ORDER BY "createdAt" DESC) as rn
                    FROM "ConversationLogs"
                    WHERE "agentId" = :agentId
                )
                SELECT * FROM RankedLogs 
                WHERE rn = 1 
                AND "createdAt" < NOW() - INTERVAL '${delayMinutes} minutes';
            `;

            const latestLogs = await Agent.sequelize.query(query, {
                replacements: { agentId: agent.id },
                type: Sequelize.QueryTypes.SELECT
            });

            for (const log of latestLogs) {
                // 4. Check how many followups sent in the specified period AFTER the last user message
                const followupCountQuery = `
                    WITH LastUserMsg AS (
                        SELECT "createdAt" 
                        FROM "ConversationLogs" 
                        WHERE "chatId" = :chatId 
                        AND "sessionId" = :sessionId
                        AND "userMessage" IS NOT NULL
                        ORDER BY "createdAt" DESC 
                        LIMIT 1
                    )
                    SELECT COUNT(*) as count 
                    FROM "ConversationLogs" 
                    WHERE "chatId" = :chatId 
                    AND "sessionId" = :sessionId
                    AND "agentId" = :agentId
                    AND metadata->>'isFollowup' = 'true'
                    AND "createdAt" >= NOW() - INTERVAL '${maxPeriod} ${maxPeriodUnit}'
                    AND "createdAt" >= COALESCE((SELECT "createdAt" FROM LastUserMsg), '1970-01-01'::timestamp)
                `;
                const [followupRes] = await Agent.sequelize.query(followupCountQuery, {
                    replacements: { chatId: log.chatId, sessionId: log.sessionId, agentId: agent.id },
                    type: Sequelize.QueryTypes.SELECT
                });

                if (parseInt(followupRes.count) >= maxCount) {
                    continue; // Skip! Reached max follow-up limit for this period or cycle.
                }

                // Find platform for this log
                let platform = platforms.find(p => p.id === log.platformId || p.sessionId === log.sessionId);
                if (!platform && platforms.length > 0) {
                    // Fallback for wrong sessionId from N8N
                    platform = platforms.find(p => p.platform === (log.chatId.includes('@') ? 'waha' : 'meta_cloud')) || platforms[0];
                }
                if (!platform) continue;

                // 5. Check labels if WAHA
                if (platform.platform === 'waha' && targetLabels.length > 0) {
                    const chatLabels = await getChatLabels(platform.sessionId, log.chatId);
                    const hasLabel = targetLabels.some(targetId => {
                        return chatLabels.some(chatLbl => {
                            const chatLblId = typeof chatLbl === 'object' ? String(chatLbl.id) : String(chatLbl);
                            return chatLblId === String(targetId.value || targetId);
                        });
                    });
                    if (!hasLabel) continue; // Skip this chat, doesn't match target label
                }

                // Prepare message
                let messageToSend = config.followupPrompt || "Halo kak, apakah ada yang bisa kami bantu lagi?";

                if (config.isAdvancedFollowup && process.env.GEMINI_API_KEY) {
                    try {
                        // Fetch last 5 messages for context
                        const history = await ConversationLog.findAll({
                            where: { chatId: log.chatId, sessionId: log.sessionId, agentId: agent.id },
                            order: [['createdAt', 'DESC']],
                            limit: 5
                        });
                        history.reverse();

                        let contextStr = history.map(h => `User: ${h.userMessage || ''}\nAI: ${h.aiResponse || ''}`).join('\n\n');
                        
                        const prompt = `System Followup Prompt: ${messageToSend}\n\nKonteks Obrolan Terakhir:\n${contextStr}\n\nKamu adalah asisten AI. Tugasmu HANYA merangkai SATU pesan followup pendek dan ramah kepada user berdasarkan 'System Followup Prompt' dan konteks di atas. Jangan menjawab pertanyaan baru, cukup sapa dan ingatkan (followup). JANGAN gunakan format markdown bold berlebihan.`;

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: prompt,
                        });
                        if (response.text) {
                            messageToSend = response.text.trim();
                        }
                    } catch (aiErr) {
                        console.error("[CRON] AI Generation error, fallback to static prompt:", aiErr.message);
                    }
                }

                // Send the message
                try {
                    const provider = platform.provider || platform.platform;
                    console.log(`[CRON] Sending followup to ${log.chatId} on ${provider}`);
                    // 6. Send Followup via N8N Webhook or WAHA Directly
                    if (provider === 'waha') {
                        await sendTextMessage(platform.sessionId, log.chatId, messageToSend);
                    } else if (provider === 'meta_cloud' || provider === 'meta') {
                        await sendCloudMessage(platform.phoneNumberId, platform.systemUserAccessToken, log.chatId, messageToSend);
                    }

                    // Log it so we don't send again!
                    await ConversationLog.create({
                        agentId: agent.id,
                        platformId: platform.id,
                        sessionId: log.sessionId,
                        chatId: log.chatId,
                        userMessage: null,
                        aiResponse: messageToSend,
                        mode: 'production',
                        metadata: { isFollowup: true }
                    });
                } catch (sendErr) {
                    console.error(`[CRON] Failed to send followup to ${log.chatId}:`, sendErr.message);
                }
            }
        }
    } catch (error) {
        console.error("[CRON] Error in checkAndSendFollowups:", error);
    }
}

export function initCron() {
    console.log("[CRON] Initializing Follow-up Scheduler (Runs every minute)");
    cron.schedule('* * * * *', checkAndSendFollowups);
}
