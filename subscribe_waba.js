// Quick script to subscribe existing WABA to webhook
// Run: NODE_TLS_REJECT_UNAUTHORIZED=0 node subscribe_waba.js

import axios from "axios";

const META_API_URL = "https://graph.facebook.com/v22.0";

async function main() {
    // Get platform data from server
    const loginRes = await axios.post("https://login.vlow-ai.com/api/auth/login", {
        email: "metareviewer@vlow.ai",
        password: "metareviewer123"
    }, { headers: { "Content-Type": "application/json" } });

    const token = loginRes.data.token;

    // Get platforms
    const platformsRes = await axios.get("https://login.vlow-ai.com/api/platforms?limit=100", {
        headers: {
            Cookie: `token=${token}`,
            Authorization: `Bearer ${token}`
        }
    });

    const metaPlatform = platformsRes.data.data.find(p => p.provider === "meta_cloud");
    if (!metaPlatform) {
        console.log("No meta_cloud platform found!");
        return;
    }

    console.log("Found platform:", metaPlatform.name);
    console.log("WABA ID:", metaPlatform.wabaId);
    console.log("Phone Number ID:", metaPlatform.phoneNumberId);
    console.log("Has access token:", !!metaPlatform.systemUserAccessToken);

    // Subscribe app to WABA
    try {
        const subRes = await axios.post(
            `${META_API_URL}/${metaPlatform.wabaId}/subscribed_apps`,
            {},
            { headers: { Authorization: `Bearer ${metaPlatform.systemUserAccessToken}` } }
        );
        console.log("✅ Webhook subscription SUCCESS:", subRes.data);
    } catch (err) {
        console.error("❌ Webhook subscription FAILED:", err?.response?.data || err.message);
    }

    // Also check what webhook URL is configured
    try {
        const appRes = await axios.get(
            `${META_API_URL}/${metaPlatform.wabaId}/subscribed_apps`,
            { headers: { Authorization: `Bearer ${metaPlatform.systemUserAccessToken}` } }
        );
        console.log("Current subscriptions:", JSON.stringify(appRes.data, null, 2));
    } catch (err) {
        console.error("Failed to check subscriptions:", err?.response?.data || err.message);
    }
}

main().catch(console.error);
