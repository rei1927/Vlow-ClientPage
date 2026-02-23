import axios from 'axios';

const run = async () => {
  try {
    const wahaUrl = 'https://waha-plus.dayamedialangit.co.id';
    
    // Test fetch sessions
    console.log("Fetching sessions from", wahaUrl);
    const sessionsRes = await axios.get(`${wahaUrl}/api/sessions`);
    const sessions = sessionsRes.data;
    console.log("Sessions:", sessions.map(s => s.name));
    
    if (sessions.length === 0) return;
    
    // Choose the first one
    const sessionName = sessions[0].name;
    
    // 1. Check Me (Is Business?)
    try {
      const meRes = await axios.get(`${wahaUrl}/api/${sessionName}/me`);
      console.log(`\n[${sessionName}] ME Result:`, typeof meRes.data, meRes.data);
    } catch(e) {
      console.log("ME Error:", e.response?.data || e.message);
    }
    
    // 2. Fetch Chats & Outgoing message
    try {
      const chatsRes = await axios.get(`${wahaUrl}/api/${sessionName}/chats?limit=5`);
      const chats = chatsRes.data.docs ? chatsRes.data.docs : chatsRes.data;
      if (chats && chats.length > 0) {
        const firstChatId = typeof chats[0].id === 'object' ? (chats[0].id._serialized || chats[0].id.id) : chats[0].id;
        console.log(`\nFetching messages for chat: ${firstChatId}`);
        const msgsRes = await axios.get(`${wahaUrl}/api/${sessionName}/chats/${firstChatId}/messages?limit=10`);
        const msgs = msgsRes.data.docs ? msgsRes.data.docs : msgsRes.data;
        
        const fromMeMsgs = msgs.filter(m => m.fromMe);
        if (fromMeMsgs.length > 0) {
          console.log(`\nSample outgoing message:`);
          console.log(JSON.stringify(fromMeMsgs[0], null, 2));
        } else if (msgs.length > 0) {
          console.log(`\nSample incoming message:`);
          console.log(JSON.stringify(msgs[0], null, 2));
        }
      }
    } catch(e) {
      console.log("Messages Error:", e.response?.data || e.message);
    }

  } catch(e) {
    console.log("Global Error:", e.message);
  }
}

run();
