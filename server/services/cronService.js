import cron from 'node-cron';
import { Sequelize } from 'sequelize';
import { GoogleGenAI } from '@google/genai';
import Agent from '../models/Agent.js';
import ConnectedPlatform from '../models/ConnectedPlatform.js';
import ConversationLog from '../models/ConversationLog.js';
import { sendTextMessage } from './wahaService.js';
import { sendCloudMessage } from './metaService.js';
import axios from 'axios';
import CustomerProfile from '../models/CustomerProfile.js';

const stripHtml = (html) => {
    if (!html) return "";
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<[^>]*>?/gm, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    return text.trim();
};

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
            let config = typeof agent.followupConfig === 'string' ? JSON.parse(agent.followupConfig) : agent.followupConfig;
            if (!config || !config.isEnabled) continue;

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
                        id, "chatId", "sessionId", "userMessage", "aiResponse", "createdAt", "metadata", "platformId",
                        ROW_NUMBER() OVER(PARTITION BY "chatId" ORDER BY "createdAt" DESC) as rn
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
            console.log(`[CRON-DEBUG] Agent ${agent.id} latestLogs count: ${latestLogs.length}`);

            for (const log of latestLogs) {
                // 4. Check how many followups sent in the specified period AFTER the last user message
                const followupCountQuery = `
                    SELECT COUNT(*) as count 
                    FROM "ConversationLogs" 
                    WHERE "chatId" = :chatId 
                    AND "sessionId" = :sessionId
                    AND "agentId" = :agentId
                    AND metadata->>'isFollowup' = 'true'
                    AND "createdAt" >= NOW() - INTERVAL '${maxPeriod} ${maxPeriodUnit}'
                `;
                const [followupRes] = await Agent.sequelize.query(followupCountQuery, {
                    replacements: { chatId: log.chatId, sessionId: log.sessionId, agentId: agent.id },
                    type: Sequelize.QueryTypes.SELECT
                });

                if (parseInt(followupRes.count) >= maxCount) {
                    console.log(`[CRON-DEBUG] Skipped ${log.chatId}: followupRes count ${followupRes.count} >= ${maxCount}`);
                    continue; // Skip! Reached max follow-up limit for this period or cycle.
                }

                // Find platform for this log
                let platform = platforms.find(p => p.id === log.platformId || p.sessionId === log.sessionId);
                if (!platform && platforms.length > 0) {
                    // Fallback for wrong sessionId from N8N
                    platform = platforms.find(p => p.provider === (log.chatId.includes('@') ? 'waha' : 'meta_cloud')) || platforms[0];
                }
                if (!platform) {
                    console.log(`[CRON-DEBUG] Skipped ${log.chatId}: No platform found`);
                    continue;
                }

                // 5. Check labels if WAHA
                if (platform.provider === 'waha' && targetLabels.length > 0) {
                    const chatLabels = await getChatLabels(platform.sessionId, log.chatId);
                    console.log(`[CRON-DEBUG] Chat ${log.chatId} labels from WAHA:`, JSON.stringify(chatLabels));
                    console.log(`[CRON-DEBUG] Chat ${log.chatId} targetLabels:`, JSON.stringify(targetLabels));
                    const hasLabel = targetLabels.some(targetId => {
                        return chatLabels.some(chatLbl => {
                            const chatLblId = typeof chatLbl === 'object' ? String(chatLbl.id) : String(chatLbl);
                            return chatLblId === String(targetId.value || targetId);
                        });
                    });
                    if (!hasLabel) {
                        console.log(`[CRON-DEBUG] Skipped ${log.chatId}: Label mismatch`);
                        continue; // Skip this chat, doesn't match target label
                    }
                }

                // Prepare message
                let messageToSend = config.prompt || "Halo kak, apakah ada yang bisa kami bantu lagi?";
                messageToSend = stripHtml(messageToSend);

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

async function syncProfilePictures() {
    try {
        const platforms = await ConnectedPlatform.findAll({ where: { provider: 'waha', status: 'WORKING' } });
        if (platforms.length === 0) return;

        for (const platform of platforms) {
            // Find 10 missing profile pics per platform
            const missingProfiles = await CustomerProfile.findAll({
                where: {
                    platformId: platform.id,
                    profilePicUrl: null
                },
                limit: 10
            });

            if (missingProfiles.length === 0) continue;

            for (const profile of missingProfiles) {
                try {
                    let contactId = profile.chatId;
                    if (!contactId.includes('@')) {
                        contactId = contactId + '@c.us';
                    }
                    
                    const res = await axios.get(`${WAHA_URL}/api/contacts/profile-picture?session=${platform.sessionId}&contactId=${encodeURIComponent(contactId)}`, { 
                        headers: HEADERS,
                        timeout: 5000 
                    });
                    
                    if (res.data && res.data.profilePictureURL) {
                        profile.profilePicUrl = res.data.profilePictureURL;
                    } else {
                        profile.profilePicUrl = 'NOT_FOUND';
                    }
                    await profile.save();
                    
                    // Delay 1 second to avoid rate limits
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e) {
                    profile.profilePicUrl = 'NOT_FOUND';
                    await profile.save();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    } catch (error) {
        console.error("[CRON] Error in syncProfilePictures:", error.message);
    }
}

let isFollowupRunning = false;

export function initCron() {
    console.log("[CRON] Initializing Follow-up Scheduler & Profile Sync (Runs every minute)");
    cron.schedule('* * * * *', async () => {
        if (isFollowupRunning) {
            console.log("[CRON] Previous check still running, skipping this minute.");
            return;
        }
        isFollowupRunning = true;
        try {
            await checkAndSendFollowups();
            await syncProfilePictures();
        } catch (err) {
            console.error("[CRON] Error in schedule:", err);
        } finally {
            isFollowupRunning = false;
        }
    });
}
