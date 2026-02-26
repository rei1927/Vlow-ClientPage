import { testChatAgent } from './controllers/agentController.js';
import User from './models/User.js';

const mockReq = {
    user: { id: "a59ffab1-b556-4c70-8fcb-254c25eb7b37" }, // admin@vlow.ai or metareviewer@vlow.ai
    body: {
            message: "lokis ada?",
            sessionId: "preview-123456",
            systemInstruction: "Kamu adalah ai agent petshop bernama pawshop",
            name: "pawshop",
            knowledgeBase: "=== lokis ===\nlokis makanan anabul harga 29rb\nAttached File (lokis): https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg",
            transferCondition: null,
            followupConfig: null
    }
};

const mockRes = {
    json: (data) => console.log("RESPONDED JSON:", data),
    status: (code) => { console.log("STATUS:", code); return mockRes; }
};

const mockNext = (err) => console.log("NEXT ERROR:", err);

async function run() {
    const user = await User.findOne({ where: { email: 'metareviewer@vlow.ai' } });
    if(user) mockReq.user.id = user.id;
    await testChatAgent(mockReq, mockRes, mockNext);
    process.exit(0);
}
run();
