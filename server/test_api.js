import axios from 'axios';
import jwt from 'jsonwebtoken';

const testAPI = async () => {
    try {
        const token = jwt.sign({ id: 'some-user-id', role: 'admin' }, 'rahasia_super_aman_sekali_ganti_ini_nanti'); // dummy token, wait, user must exist in DB.
        
        // I will just impersonate 'metareviewer@vlow.ai'
        
        const payload = {
            message: "lokis ada?",
            sessionId: "preview-123456",
            systemInstruction: "Kamu adalah ai agent petshop bernama pawshop",
            name: "pawshop",
            knowledgeBase: "=== lokis ===\nlokis makanan anabul harga 29rb\nAttached File (e843f0a8-1f9d-4d36-abbb-2ce585928b7b.jpeg): https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg",
            transferCondition: null,
            followupConfig: null
        };

        const res = await axios.post("http://localhost:5000/api/agents/85701e7f-2123-4ab9-a80d-24f3d0125e34/test-chat", payload, {
           headers: {
             "Cookie": `token=${token}` // or Authorization Bearer if used
           }
        });
        
        console.log("SUCCESS:", res.data);
    } catch (e) {
        console.error("FAIL:", e.response?.data || e.message);
    }
}
testAPI();
