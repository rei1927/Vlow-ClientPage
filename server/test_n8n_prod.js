import axios from 'axios';

const testN8N = async () => {
    try {
        const payload = {
            mode: "simulation",
            sessionId: "preview-123456",
            message: "lokis ada?",
            agentConfig: {
                name: "pawshop",
                systemInstruction: "Kamu adalah AI assistant pawshop.",
                knowledgeBase: "=== lokis ===\nlokis makanan anabul harga 29rb\nAttached File (lokis): https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg",
                followupConfig: null
            }
        };
        const response = await axios.post("https://n8n.dayamedialangit.co.id/webhook/simulator-chat", payload);
        console.log("N8N RESPONSE:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("FAIL:", e.message);
        if(e.response) console.error("Response data:", e.response.data);
    }
}
testN8N();
