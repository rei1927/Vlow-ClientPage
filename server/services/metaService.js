import axios from "axios";
import AppError from "../utils/AppError.js";

const META_API_URL = "https://graph.facebook.com/v22.0";

// Exchange auth code for long-lived access token
export const exchangeAuthCode = async (code) => {
    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;

        if (!appId || !appSecret) {
            throw new AppError("META_APP_ID atau META_APP_SECRET belum dikonfigurasi di setup server (.env).", 500);
        }

        console.log("Exchanging Meta code for token. App ID:", appId, "Code length:", code?.length);

        // Step 1: Exchange code for short-lived access token
        // NOTE: No redirect_uri needed for FB.login JS SDK flow
        const response = await axios.get(`${META_API_URL}/oauth/access_token`, {
            params: {
                client_id: appId,
                client_secret: appSecret,
                code: code,
            },
        });

        console.log("Meta token exchange SUCCESS. Token type:", response.data.token_type);

        // response.data berisi: { access_token, token_type, expires_in }
        return response.data;
    } catch (error) {
        const fbError = error?.response?.data?.error;
        console.error("Meta Token Exchange Error:", JSON.stringify(fbError || error?.response?.data || error.message, null, 2));

        if (fbError?.message) {
            throw new AppError(`Meta API Error: ${fbError.message}`, 400);
        }
        throw new AppError("Gagal menukar Meta Auth Code dengan Access Token. Silakan coba lagi.", 400);
    }
};

// Get WABA ID and Phone Number details
export const getWhatsAppBusinessAccounts = async (accessToken) => {
    try {
        // First, debug the token to see what scopes we have
        const debugRes = await axios.get(`${META_API_URL}/debug_token`, {
            params: { input_token: accessToken, access_token: accessToken },
        });
        console.log("Token scopes:", debugRes.data?.data?.scopes);
        console.log("Token granular_scopes:", JSON.stringify(debugRes.data?.data?.granular_scopes));

        // Try approach 1: /me/businesses → /{business_id}/owned_whatsapp_business_accounts
        try {
            const bizRes = await axios.get(`${META_API_URL}/me/businesses`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            console.log("Businesses:", JSON.stringify(bizRes.data?.data));

            if (bizRes.data?.data?.length > 0) {
                for (const biz of bizRes.data.data) {
                    try {
                        const wabaRes = await axios.get(`${META_API_URL}/${biz.id}/owned_whatsapp_business_accounts`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        if (wabaRes.data?.data?.length > 0) {
                            return wabaRes.data.data;
                        }
                    } catch (e) {
                        console.log(`No WABA for business ${biz.id}:`, e?.response?.data?.error?.message);
                    }
                }
            }
        } catch (e) {
            console.log("Businesses fetch failed:", e?.response?.data?.error?.message);
        }

        // Try approach 2: Direct /me/client_whatsapp_business_accounts (legacy)
        try {
            const wabaResponse = await axios.get(`${META_API_URL}/me/client_whatsapp_business_accounts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return wabaResponse.data.data;
        } catch (e) {
            console.log("client_whatsapp_business_accounts failed:", e?.response?.data?.error?.message);
        }

        throw new AppError("Tidak dapat menemukan WhatsApp Business Account. Pastikan Embedded Signup dialog tampil lengkap.", 400);
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error("Meta WABA Fetch Error FULL:", JSON.stringify(error?.response?.data || error.message, null, 2));

        if (error?.response?.data?.error?.code === 100) {
            throw new AppError("Aplikasi Meta Anda belum memiliki Produk 'WhatsApp' atau izin 'whatsapp_business_management' tidak disetujui saat login.", 400);
        }

        throw new AppError("Gagal mengambil data WhatsApp Business Account dari profil Anda.", 400);
    }
};

export const getPhoneNumbers = async (wabaId, accessToken) => {
    try {
        const response = await axios.get(`${META_API_URL}/${wabaId}/phone_numbers`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data.data;
    } catch (error) {
        console.error("Meta Phone Number Fetch Error:", error?.response?.data || error.message);
        throw new AppError("Gagal mengambil nomor WhatsApp Business dari akun Anda.", 400);
    }
};

// Subscribe our App to the WABA Webhooks
export const subscribeAppToWABA = async (wabaId, accessToken) => {
    try {
        const response = await axios.post(
            `${META_API_URL}/${wabaId}/subscribed_apps`,
            {},
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Meta Webhook Subscribe Error:", error?.response?.data || error.message);
        throw new AppError("Gagal mendaftarkan aplikasi pada Webhook WABA Anda.", 400);
    }
};

// Send WhatsApp Message via Cloud API
export const sendCloudMessage = async (phoneNumberId, accessToken, to, messageText) => {
    try {
        const response = await axios.post(
            `${META_API_URL}/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { body: messageText },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Meta Send Message Error:", error?.response?.data || error.message);
        throw new AppError("Gagal mengirim pesan via WhatsApp Cloud API", 500);
    }
};

// Register phone number for Cloud API messaging
export const registerPhoneNumber = async (phoneNumberId, accessToken, pin = "123456") => {
    try {
        const response = await axios.post(
            `${META_API_URL}/${phoneNumberId}/register`,
            {
                messaging_product: "whatsapp",
                pin: pin,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Meta Register Phone Error:", error?.response?.data || error.message);
        throw new AppError(`Gagal mendaftarkan nomor untuk Cloud API: ${error?.response?.data?.error?.message || error.message}`, 400);
    }
};
