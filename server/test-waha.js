import axios from 'axios';
const getMessages = async () => {
  // Let's connect to the DB string locally provided in .env
  // Wait, I can just query the platform table or directly hit the local WAHA API if it's running
  try {
    const res = await axios.get("http://localhost:7575/api/sessions");
    console.log("Sessions:", res.data);
    const sessions = res.data;
    if (sessions.length > 0) {
       for (const s of sessions) {
         console.log("Session:", s.name);
         const chatsRes = await axios.get(`http://localhost:7575/api/${s.name}/chats?limit=2`);
         const chats = chatsRes.data.docs ? chatsRes.data.docs : chatsRes.data;
         
         if (chats && chats.length > 0) {
            const chatId = typeof chats[0].id === 'object' ? chats[0].id._serialized || chats[0].id.id : chats[0].id;
            console.log("Chat 1 ID:", chatId);
            const msgsRes = await axios.get(`http://localhost:7575/api/${s.name}/chats/${chatId}/messages?limit=2`);
            console.log("Messages preview:");
            console.log(JSON.stringify(msgsRes.data).substring(0, 1000));
         }
       }
    }
  } catch(e) { console.error(e.message); }
}
getMessages();
