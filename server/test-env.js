import { config } from 'dotenv';
import path from 'path';
import axios from 'axios';

config({ path: path.resolve(process.cwd(), '.env') });

const run = async () => {
    const wahaUrl = process.env.WAHA_BASE_URL || 'https://waha-plus.dayamedialangit.co.id';
    const API_KEY = process.env.WAHA_API_KEY;
    const HEADERS = {
      "Content-Type": "application/json",
      ...(API_KEY && { "X-Api-Key": API_KEY }),
    };
    
    console.log("Using API Key:", API_KEY ? "YES" : "NO");
    
    try {
      const sessionsRes = await axios.get(`${wahaUrl}/api/sessions`, { headers: HEADERS });
      const sessions = sessionsRes.data;
      if (sessions.length === 0) return;
      
      const sessionName = sessions.find(s => s.status === "WORKING")?.name || sessions[0].name;
      console.log("Using Session:", sessionName);

      const chatsRes = await axios.get(`${wahaUrl}/api/${sessionName}/chats?limit=3`, { headers: HEADERS });
      const chats = chatsRes.data.docs ? chatsRes.data.docs : chatsRes.data;
      if (chats && chats.length > 0) {
        console.log(`\nFIRST CHAT OBJECT keys:`, Object.keys(chats[0]));
        if (chats[0].labels) console.log("Chat 1 labels property:", chats[0].labels);
        else console.log("No labels property in chat object!");
        
        console.log("Sample chat object data:", JSON.stringify(chats[0]).substring(0, 300));
      }
    } catch(e) {
      console.log("Error:", e.response?.data || e.message);
    }
}
run();
