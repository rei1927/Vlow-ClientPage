import ConnectedPlatform from "../models/ConnectedPlatform.js";
import ChatHandover from "../models/ChatHandover.js";
import Agent from "../models/Agent.js";
import MetaMessage from "../models/MetaMessage.js";
import User from "../models/User.js";
import axios from "axios";

// Digunakan oleh Meta untuk Veryfikasi URL Webhook
export const verifyMetaWebhook = (req, res) => {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === verifyToken) {
            console.log("✅ Meta Webhook Verified!");
            return res.status(200).send(challenge);
        } else {
            console.error("❌ Meta Webhook Verification Failed: Token mismatch");
            return res.sendStatus(403);
        }
    }
    return res.sendStatus(400);
};

// Digunakan untuk menerima Notifikasi/Pesan Masuk dari Meta
export const receiveMetaWebhook = async (req, res) => {
    try {
        const { object, entry } = req.body;
        console.log("[Webhook] Received event:", object, "entries:", entry?.length, JSON.stringify(req.body).substring(0, 500));

        // Pastikan ini hook dari Whatsapp
        if (object !== "whatsapp_business_account") {
            return res.sendStatus(404);
        }

        // WAJIB: Langsung kirim 200 OK ke Meta agar tidak kena retries penalty beruntun
        res.status(200).send("EVENT_RECEIVED");

        // Loop & Proses Payload (Biasanya 1 array, tapi Meta merekomendasikan Loop)
        if (entry && entry.length > 0) {
            for (const ent of entry) {
                if (ent.changes && ent.changes.length > 0) {
                    for (const change of ent.changes) {
                        if (!change.value) continue;

                        const phoneNumberId = change.value.metadata?.phone_number_id;
                        console.log("[Webhook] Looking up platform for phoneNumberId:", phoneNumberId);

                        // Identifikasi milik siapa pesan ini berdasarkan Phone Number ID Meta
                        const platform = await ConnectedPlatform.findOne({
                            where: {
                                phoneNumberId: phoneNumberId,
                                provider: "meta_cloud",
                                status: "WORKING"
                            },
                            include: [{ model: User, attributes: ["n8nWebhookUrl"] }]
                        });

                        if (!platform) {
                            console.error("[Webhook] ⚠️ No platform found for phoneNumberId:", phoneNumberId);
                            // List all meta_cloud platforms for debugging
                            const allPlatforms = await ConnectedPlatform.findAll({
                                where: { provider: "meta_cloud" },
                                attributes: ["id", "phoneNumberId", "status"],
                                raw: true,
                            });
                            console.log("[Webhook] Existing meta_cloud platforms:", JSON.stringify(allPlatforms));
                            continue;
                        }
                        console.log("[Webhook] ✅ Platform found:", platform.id);

                        // --- Store incoming messages ---
                        if (change.value.messages && change.value.messages.length > 0) {
                            const contacts = change.value.contacts || [];

                            for (const msg of change.value.messages) {
                                const contact = contacts.find(c => c.wa_id === msg.from) || {};

                                // Extract message body based on type
                                let body = "";
                                switch (msg.type) {
                                    case "text":
                                        body = msg.text?.body || "";
                                        break;
                                    case "image":
                                        body = msg.image?.caption || "📷 Gambar";
                                        break;
                                    case "video":
                                        body = msg.video?.caption || "🎥 Video";
                                        break;
                                    case "audio":
                                        body = "🎵 Pesan Suara";
                                        break;
                                    case "document":
                                        body = msg.document?.filename || "📄 Dokumen";
                                        break;
                                    case "sticker":
                                        body = "🌟 Stiker";
                                        break;
                                    case "location":
                                        body = `📍 Lokasi: ${msg.location?.latitude}, ${msg.location?.longitude}`;
                                        break;
                                    case "contacts":
                                        body = "👤 Kontak";
                                        break;
                                    case "reaction":
                                        body = msg.reaction?.emoji || "👍";
                                        break;
                                    default:
                                        body = `(${msg.type})`;
                                }

                                try {
                                    await MetaMessage.findOrCreate({
                                        where: { waMessageId: msg.id },
                                        defaults: {
                                            platformId: platform.id,
                                            chatId: msg.from,
                                            contactName: contact.profile?.name || null,
                                            fromMe: false,
                                            body: body,
                                            type: msg.type || "text",
                                            timestamp: parseInt(msg.timestamp) || Math.floor(Date.now() / 1000),
                                            status: "received",
                                        }
                                    });
                                } catch (dbErr) {
                                    console.error("[Webhook] DB save error:", dbErr.message);
                                }
                            }
                        }

                        // --- Update message statuses (delivered, read) ---
                        if (change.value.statuses && change.value.statuses.length > 0) {
                            for (const status of change.value.statuses) {
                                try {
                                    await MetaMessage.update(
                                        { status: status.status },
                                        { where: { waMessageId: status.id, platformId: platform.id } }
                                    );
                                } catch (e) { /* ignore status update failures */ }
                            }
                        }

                        // --- Forward to n8n (existing behavior) ---
                        if (platform.User && platform.User.n8nWebhookUrl) {
                            try {
                                await axios.post(platform.User.n8nWebhookUrl, req.body, {
                                    headers: { "Content-Type": "application/json" }
                                });
                                console.log(`[Webhook] Forwarded Meta event to n8n for platform: ${platform.id}`);
                            } catch (err) {
                                console.error(`[Webhook] Failed to forward to n8n:`, err?.response?.data || err.message);
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Meta Webhook Processing Error:", error);
    }
};

// =============================================
// WAHA WEBHOOK PROXY — Intercept sebelum ke n8n
// =============================================

// Helper: Teruskan payload WAHA ke n8n user
const forwardToN8n = async (payload, sessionId) => {
    try {
        const platform = await ConnectedPlatform.findOne({
            where: { sessionId, provider: "waha" },
            include: [{ model: User, attributes: ["n8nWebhookUrl"] }],
        });

        const n8nUrl = platform?.User?.n8nWebhookUrl;
        if (!n8nUrl) return;

        await axios.post(n8nUrl, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
        console.log(`✅ [WAHA Proxy] Forwarded to n8n: ${n8nUrl}`);
    } catch (err) {
        console.error(`[WAHA Proxy] Forward to n8n failed:`, err?.response?.data || err.message);
    }
};

// Semua pesan WAHA melewati backend dulu.
// Jika chat berlabel Human (handover aktif) → pesan DIBLOKIR, AI diam.
// Jika chat dalam mode AI → pesan diteruskan ke n8n untuk diproses AI.
export const receiveWahaWebhook = async (req, res) => {
    try {
        const payload = req.body;
        const event = payload.event;
        const sessionId = payload.session;

        // Langsung balas 200 OK ke WAHA agar tidak retry
        res.status(200).send("OK");

        // Jika BUKAN event pesan masuk, langsung teruskan ke n8n
        if (!event.startsWith("message") || !payload.payload) {
            return forwardToN8n(payload, sessionId);
        }

        const msgPayload = payload.payload;

        // 1. Cari platform dan agent (Harus di awal agar bisa ambil konfigurasi handover)
        const platform = await ConnectedPlatform.findOne({
            where: { sessionId, provider: "waha" },
            include: [
                { model: Agent },
                { model: User, attributes: ["n8nWebhookUrl"] },
            ],
        });

        if (!platform) {
            console.error(`[WAHA Proxy] ⚠️ Platform tidak ditemukan untuk sesi: ${sessionId}`);
            return res.status(200).send("OK");
        }

        const n8nUrl = platform.User?.n8nWebhookUrl;
        if (!n8nUrl) {
            console.error(`[WAHA Proxy] ⚠️ n8n Webhook URL belum diset untuk user platform ${platform.id}`);
            return res.status(200).send("OK");
        }

        const handoverConfig = platform.Agent?.handoverConfig || {};
        const chatId = msgPayload.from;
        const messageBody = msgPayload.body || "";

        // 2. CEK PESAN DARI DIRI SENDIRI (HP / API)
        if (msgPayload.fromMe) {
            const messageId = typeof msgPayload.id === 'string' ? msgPayload.id : (msgPayload.id?.id || "");
            // Deteksi apakah pesan ini dari API (bot) atau murni dari HP (manusia).
            // Baileys (engine WAHA) biasanya menggunakan ID berawalan BAE5 atau 3EB0 untuk pesan API.
            const isApiMessage = messageId.startsWith("BAE5") || messageId.startsWith("3EB0") || messageId.startsWith("WAHA");

            if (!isApiMessage && handoverConfig.enabled) {
                console.log(`📱 [WAHA Proxy] Pesan dari HP owner terdeteksi (${chatId}). Mengaktifkan Handover (Take Over).`);
                const autoReleaseMinutes = handoverConfig.autoReleaseMinutes || 30;
                const { handoverLabelId, aiLabelId } = handoverConfig;

                const [handover, created] = await ChatHandover.findOrCreate({
                    where: { chatId, sessionId },
                    defaults: {
                        platformId: platform.id,
                        agentId: platform.Agent?.id || null,
                        status: "human",
                        triggeredBy: "owner_reply",
                        activatedAt: new Date(),
                        autoReleaseAt: new Date(Date.now() + autoReleaseMinutes * 60 * 1000),
                        releasedAt: null,
                    },
                });

                if (!created) {
                    handover.status = "human";
                    handover.triggeredBy = "owner_reply";
                    handover.activatedAt = new Date();
                    handover.autoReleaseAt = new Date(Date.now() + autoReleaseMinutes * 60 * 1000);
                    handover.releasedAt = null;
                    await handover.save();
                }

                // Swap labels di WhatsApp
                try {
                    const { updateChatLabels } = await import("../services/wahaService.js");
                    if (handoverLabelId) await updateChatLabels(sessionId, chatId, String(handoverLabelId), "add");
                    if (aiLabelId) await updateChatLabels(sessionId, chatId, String(aiLabelId), "remove");
                } catch (e) {
                    console.error("[WAHA Proxy] Label swap error from phone reply:", e.message);
                }
            }

            // Tetap teruskan ke n8n (mungkin n8n butuh mencatat log)
            return forwardToN8n(payload, sessionId);
        }

        console.log(`📨 [WAHA Proxy] Pesan masuk dari ${chatId} di sesi ${sessionId}: "${messageBody.substring(0, 50)}..."`);

        // 3. CEK KEYWORD TRIGGER (sebelum cek handover)
        if (handoverConfig.enabled && Array.isArray(handoverConfig.keywords) && handoverConfig.keywords.length > 0) {
            const lowerMessage = messageBody.toLowerCase();
            const matchedKeyword = handoverConfig.keywords.find((kw) =>
                lowerMessage.includes(kw.toLowerCase())
            );

            if (matchedKeyword) {
                console.log(`🔑 [WAHA Proxy] Keyword "${matchedKeyword}" terdeteksi! Mengaktifkan handover untuk ${chatId}`);

                const autoReleaseMinutes = handoverConfig.autoReleaseMinutes || 30;
                const { handoverLabelId, aiLabelId } = handoverConfig;

                // Upsert handover record
                const [handover, created] = await ChatHandover.findOrCreate({
                    where: { chatId, sessionId },
                    defaults: {
                        platformId: platform.id,
                        agentId: platform.Agent?.id || null,
                        status: "human",
                        triggeredBy: "auto_keyword",
                        triggerKeyword: matchedKeyword,
                        activatedAt: new Date(),
                        autoReleaseAt: new Date(Date.now() + autoReleaseMinutes * 60 * 1000),
                        releasedAt: null,
                    },
                });

                if (!created) {
                    handover.status = "human";
                    handover.triggeredBy = "auto_keyword";
                    handover.triggerKeyword = matchedKeyword;
                    handover.activatedAt = new Date();
                    handover.autoReleaseAt = new Date(Date.now() + autoReleaseMinutes * 60 * 1000);
                    handover.releasedAt = null;
                    await handover.save();
                }

                // Swap labels di WhatsApp
                try {
                    const { updateChatLabels } = await import("../services/wahaService.js");
                    if (handoverLabelId) await updateChatLabels(sessionId, chatId, String(handoverLabelId), "add");
                    if (aiLabelId) await updateChatLabels(sessionId, chatId, String(aiLabelId), "remove");
                } catch (e) {
                    console.error("[WAHA Proxy] Label swap error:", e.message);
                }

                // Kirim pesan handover ke customer
                if (handoverConfig.responseMessage) {
                    try {
                        const { sendTextMessage } = await import("../services/wahaService.js");
                        await sendTextMessage(sessionId, chatId, handoverConfig.responseMessage);
                    } catch (e) {
                        console.error("[WAHA Proxy] Gagal kirim pesan handover:", e.message);
                    }
                }

                // BLOKIR — jangan teruskan ke n8n
                console.log(`🚫 [WAHA Proxy] Pesan DIBLOKIR (keyword handover aktif). AI tidak akan membalas.`);
                return;
            }
        }

        // 3. CEK STATUS HANDOVER
        const handover = await ChatHandover.findOne({
            where: { chatId, sessionId, status: "human" },
        });

        if (handover) {
            console.log(`🚫 [WAHA Proxy] Pesan dari ${chatId} DIBLOKIR — chat sedang dalam mode HUMAN (handover aktif).`);
            return; // BLOKIR — AI diam
        }

        // 4. MODE AI — Teruskan ke n8n
        console.log(`✅ [WAHA Proxy] Chat ${chatId} dalam mode AI. Meneruskan ke n8n: ${n8nUrl}`);
        try {
            await axios.post(n8nUrl, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 10000,
            });
        } catch (err) {
            console.error(`[WAHA Proxy] Gagal meneruskan ke n8n:`, err?.response?.data || err.message);
        }
    } catch (error) {
        console.error("[WAHA Proxy] Error:", error.message);
    }
};

// Digunakan untuk menerima data/object dari n8n
export const receiveN8nWebhook = async (req, res) => {
    try {
        const data = req.body;

        console.log("📥 [n8n Webhook] Received payload from n8n:", JSON.stringify(data, null, 2));

        // Sementara hanya melog data dan membalas dengan status 200 OK
        // Jika perlu menyimpan ke sistem (misal jadi Lead atau Conversation), tambahkan logika di sini

        return res.status(200).json({
            success: true,
            message: "Webhook data received successfully from n8n",
            data: data
        });

    } catch (error) {
        console.error("❌ [n8n Webhook] Error processing data:", error);
        return res.status(500).json({ success: false, message: "Internal server error processing n8n webhook" });
    }
};

// @desc    Save outgoing AI message to MetaMessage DB so it appears in dashboard chat
// @route   POST /api/webhooks/n8n/outgoing-message
// @access  Public (called by n8n after sending AI reply)
export const receiveN8nOutgoingMessage = async (req, res) => {
    try {
        const { phoneNumberId, chatId, body, waMessageId, type } = req.body;

        console.log(`📤 [n8n Outgoing] Saving AI reply for chat ${chatId}: "${body?.substring(0, 80)}..."`);

        if (!phoneNumberId || !chatId || !body) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: phoneNumberId, chatId, body"
            });
        }

        // Find the platform by phoneNumberId
        const platform = await ConnectedPlatform.findOne({
            where: {
                phoneNumberId: phoneNumberId,
                provider: "meta_cloud",
                status: "WORKING"
            }
        });

        if (!platform) {
            console.error("[n8n Outgoing] ⚠️ No platform found for phoneNumberId:", phoneNumberId);
            return res.status(404).json({ success: false, message: "Platform not found" });
        }

        // Save the outgoing AI message
        await MetaMessage.create({
            platformId: platform.id,
            waMessageId: waMessageId || `n8n_${Date.now()}`,
            chatId: chatId,
            fromMe: true,
            body: body,
            type: type || "text",
            timestamp: Math.floor(Date.now() / 1000),
            status: "sent",
        });

        console.log(`✅ [n8n Outgoing] AI message saved for chat ${chatId}`);

        return res.status(200).json({
            success: true,
            message: "Outgoing message saved successfully"
        });

    } catch (error) {
        console.error("❌ [n8n Outgoing] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
