import axios from 'axios';

const WAHA_URL = 'https://waha-plus.dayamedialangit.co.id';
const API_KEY = 'rahasia123';
const headers = { 'X-Api-Key': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' };

async function run() {
    try {
        const sessionId = 'meta_reviewer_071a01ec_1771829008557';
        const rawChatId = '66365851451404@lid';
        const encodedChatId = encodeURIComponent(rawChatId);

        console.log("1. Fetch existing labels for this chat...");
        let currentLabels = [];
        try {
            const getRes = await axios.get(`${WAHA_URL}/api/${sessionId}/labels/chats/${encodedChatId}/`, { headers });
            currentLabels = Array.isArray(getRes.data) ? getRes.data : [];
            console.log("Existing labels:", currentLabels);
        } catch (err) {
            console.log("Error getting labels. Status:", err.response?.status, err.response?.data);
        }

        console.log("\n2. Trying to PUT a new array with label ID '1'...");

        // Let's try sending just the IDs
        const payload = {
            labels: [{ id: "1" }]
        };

        const putRes = await axios.put(`${WAHA_URL}/api/${sessionId}/labels/chats/${encodedChatId}/`, payload, { headers });
        console.log("PUT Response:", putRes.data);
    } catch (e) {
        console.error("PUT Error:", e.response?.data || e.message);
    }
}

run();
