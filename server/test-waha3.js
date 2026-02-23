import axios from 'axios';

const run = async () => {
  try {
    const sessionsRes = await axios.get("http://localhost:7575/api/sessions");
    console.log("Found sessions:", sessionsRes.data.map(s => s.name));
    if (sessionsRes.data.length === 0) return;
    
    // Pick the first running session
    const session = sessionsRes.data.find(s => s.status === "WORKING")?.name || sessionsRes.data[0].name;
    console.log("Using session:", session);
    
    try {
      const meRes = await axios.get(`http://localhost:7575/api/${session}/me`);
      console.log("ME Data:", meRes.data);
    } catch(e) { console.log("ME Error:", e.message) }

    try {
      const chatsRes = await axios.get(`http://localhost:7575/api/${session}/chats?limit=5`);
      const chats = chatsRes.data.docs || chatsRes.data;
      const firstChatId = typeof chats[0].id === 'object' ? (chats[0].id._serialized || chats[0].id.id) : chats[0].id;

      const msgsRes = await axios.get(`http://localhost:7575/api/${session}/chats/${firstChatId}/messages?limit=10`);
      const msgs = msgsRes.data.docs || msgsRes.data;
      const fromMeMsgs = msgs.filter(m => m.fromMe);
      if (fromMeMsgs.length > 0) {
        console.log("Sent message object:", JSON.stringify(fromMeMsgs[0], null, 2));
      }
    } catch(e) { console.log("Chat error:", e.message); }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
