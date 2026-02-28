import ConnectedPlatform from "../models/ConnectedPlatform.js";
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
