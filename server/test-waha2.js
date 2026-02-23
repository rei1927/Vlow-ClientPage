import axios from 'axios';

const run = async () => {
  try {
    const session = "meta_reviewer_071a01ec_1771826385368";
    
    console.log("Fetching ME for session:", session);
    const meRes = await axios.get(`http://localhost:7575/api/${session}/me`, { timeout: 5000 }).catch(e => e.response);
    console.log("ME Status:", meRes.status);
    console.log("ME Data:", meRes.data);

    console.log("\nFetching chats...");
    const chatsRes = await axios.get(`http://localhost:7575/api/${session}/chats?limit=5`);
    const chats = chatsRes.data.docs || chatsRes.data;
    const firstChatId = typeof chats[0].id === 'object' ? (chats[0].id._serialized || chats[0].id.id) : chats[0].id;

    console.log("\nFetching messages for chat:", firstChatId);
    const msgsRes = await axios.get(`http://localhost:7575/api/${session}/chats/${firstChatId}/messages?limit=5`);
    const msgs = msgsRes.data.docs || msgsRes.data;
    
    if (msgs && msgs.length > 0) {
      console.log("\nSample message object (fromMe: true):");
      const fromMeMsgs = msgs.filter(m => m.fromMe);
      const toShow = fromMeMsgs.length > 0 ? fromMeMsgs[0] : msgs[0];
      console.log(JSON.stringify(toShow, null, 2));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
