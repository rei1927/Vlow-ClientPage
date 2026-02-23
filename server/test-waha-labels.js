import axios from 'axios';

const WAHA_URL = 'https://waha-plus.dayamedialangit.co.id';
const API_KEY = 'rahasia123';
const headers = { 'X-Api-Key': API_KEY, 'Accept': 'application/json' };

async function run() {
    try {
        console.log("1. Fetching sessions...");
        const sessRes = await axios.get(`${WAHA_URL}/api/sessions`, { headers });
        const sessions = sessRes.data;
        if (sessions.length === 0) {
            console.log("No sessions found.");
            return;
        }

        console.log("Active sessions:", sessions.map(s => s.name).join(', '));

        for (const session of sessions) {
            if (session.status !== 'WORKING') continue;
            const sessionName = session.name;
            console.log(`\n--- Inspecting session: ${sessionName} ---`);

            try {
                const labelRes = await axios.get(`${WAHA_URL}/api/${sessionName}/labels`, { headers });
                const labelsData = labelRes.data;
                const actualLabels = Array.isArray(labelsData) ? labelsData : (labelsData && Array.isArray(labelsData.docs) ? labelsData.docs : null);

                if (actualLabels && actualLabels.length > 0) {
                    console.log(`Found ${actualLabels.length} master labels in ${sessionName}!`);
                    console.log("Master Labels (First 2):", JSON.stringify(actualLabels.slice(0, 2), null, 2));

                    // Test fetching chats for the first label
                    const firstLabelId = actualLabels[0].id;
                    try {
                        console.log(`\nFetching chats for label ID ${firstLabelId}...`);
                        const labelChatsRes = await axios.get(`${WAHA_URL}/api/${sessionName}/labels/${firstLabelId}/chats`, { headers });
                        console.log(`Label ${firstLabelId} chats response:`, JSON.stringify(labelChatsRes.data, null, 2));
                    } catch (err) {
                        console.log(`Error fetching chats for label ${firstLabelId}:`, err.message);
                    }

                    const chatRes = await axios.get(`${WAHA_URL}/api/${sessionName}/chats?limit=50`, { headers });
                    const chats = chatRes.data.docs || chatRes.data;

                    const chatWithLabel = chats.find(c => c.labels && c.labels.length > 0);
                    if (chatWithLabel) {
                        console.log("\nFound chat with labels direct property!");
                        console.log("Labels:", JSON.stringify(chatWithLabel.labels));
                    } else {
                        const sample = chats[0];
                        console.log("\nNo labels property found in direct scope. Sample chat:");
                        console.log("Sample ID:", JSON.stringify(sample?.id));
                        console.log("Sample Direct Labels:", JSON.stringify(sample?.labels));
                        console.log("Sample _chat.labels:", sample?._chat ? JSON.stringify(sample._chat.labels) : 'N/A');
                    }
                } else {
                    console.log(`No master labels in ${sessionName}.`);
                }
            } catch (err) {
                console.log(`Error checking session ${sessionName}: ${err.message}`);
            }
        }

    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}

run();
