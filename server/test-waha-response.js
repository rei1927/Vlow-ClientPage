import axios from 'axios';

const run = async () => {
  try {
    const wahaUrl = 'https://waha-plus.dayamedialangit.co.id';
    
    // Fetch sessions
    const sessionsRes = await axios.get(`${wahaUrl}/api/sessions`);
    const sessions = sessionsRes.data;
    if (sessions.length === 0) return;
    
    const sessionName = sessions[0].name;
    console.log("Using Session:", sessionName);
    
    // Fetch all labels
    try {
      const labelsRes = await axios.get(`${wahaUrl}/api/${sessionName}/labels`);
      console.log(`\nALL LABELS:`);
      console.log(JSON.stringify(labelsRes.data).substring(0, 500));
    } catch(e) {}

    // Fetch Chats
    try {
      const chatsRes = await axios.get(`${wahaUrl}/api/${sessionName}/chats?limit=3`);
      const chats = chatsRes.data.docs ? chatsRes.data.docs : chatsRes.data;
      if (chats && chats.length > 0) {
        console.log(`\nFIRST CHAT OBJECT:`);
        console.log(JSON.stringify(chats[0], null, 2));

        const firstChatId = typeof chats[0].id === 'object' ? (chats[0].id._serialized || chats[0].id.id) : chats[0].id;
        
        console.log(`\nTesting GET Messages for Chat ID: ${firstChatId}`);
        const msgsRes = await axios.get(`${wahaUrl}/api/${sessionName}/chats/${firstChatId}/messages?limit=2`);
        console.log("Messages Success. Count:", msgsRes.data?.docs?.length || msgsRes.data?.length);

      }
    } catch(e) {
      console.log("Error in fetching chats/msgs:", e.response?.data || e.message);
    }
    
  } catch(e) {
    console.log("Global Error:", e.message);
  }
}

run();
