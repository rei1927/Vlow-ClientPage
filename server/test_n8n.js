import axios from 'axios';

const testN8N = async () => {
    try {
        const payload = {
            mode: "simulation",
            sessionId: "preview-123",
            message: "lokis ada?",
            agentConfig: {
                name: "pawshop",
                systemInstruction: "Kamu adalah AI assistant pawshop. Jawab pertanyaan soal produk.",
                knowledgeBase: "=== lokis ===\nlokis makanan anabul harga 29rb\nAttached File (lokis): https://minio.dayamedialangit.co.id/vlow-client/lokis.jpeg",
                followupConfig: null
            }
        };
        const response = await axios.post("https://n8n.srv1213369.hstgr.cloud/webhook-test/simulator-chat", payload);
        console.log("N8N RESPONSE:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("FAIL:", e.message);
        if(e.response) console.error("Response data:", e.response.data);
    }
}
testN8N();
