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

        const response = await axios.get(`${META_API_URL}/oauth/access_token`, {
            params: {
                client_id: appId,
                client_secret: appSecret,
                code: code,
            },
        });

        // response.data berisi: { access_token, token_type, expires_in }
        return response.data;
    } catch (error) {
        console.error("Meta Token Exchange Error FULL:", JSON.stringify(error?.response?.data || error.message, null, 2));
        throw new AppError("Gagal menukar Meta Auth Code dengan Access Token. Silakan coba lagi.", 400);
    }
};

// Get WABA ID and Phone Number details
export const getWhatsAppBusinessAccounts = async (accessToken) => {
    try {
        // 1. Get WABA IDs associated with this token
        const wabaResponse = await axios.get(`${META_API_URL}/me/client_whatsapp_business_accounts`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return wabaResponse.data.data; // Array of WABA objects
    } catch (error) {
        console.error("Meta WABA Fetch Error FULL:", JSON.stringify(error?.response?.data || error.message, null, 2));
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
