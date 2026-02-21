import ConnectedPlatform from "../models/ConnectedPlatform.js";
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

                        // Kita fokus pada 'messages' atau 'statuses'
                        if (change.value && (change.value.messages || change.value.statuses)) {
                            const phoneNumberId = change.value.metadata.phone_number_id;

                            // Identifikasi milik siapa pesan ini berdasarkan Phone Number ID Meta
                            const platform = await ConnectedPlatform.findOne({
                                where: {
                                    phoneNumberId: phoneNumberId,
                                    provider: "meta_cloud",
                                    status: "WORKING"
                                },
                                include: [{ model: User, attributes: ["n8nWebhookUrl"] }]
                            });

                            // Jika Client/User ini sudah mensetup n8n Webhook URL...
                            if (platform && platform.User && platform.User.n8nWebhookUrl) {
                                // ...Teruskan Mentah-Mentah (Forward) ke n8n mereka!
                                try {
                                    await axios.post(platform.User.n8nWebhookUrl, req.body, {
                                        headers: { "Content-Type": "application/json" }
                                    });
                                    console.log(`[Webhook] Forwarded Meta event to n8n for User: ${platform.User.id}`);
                                } catch (err) {
                                    console.error(`[Webhook] Failed to forward to n8n:`, err?.response?.data || err.message);
                                }
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
