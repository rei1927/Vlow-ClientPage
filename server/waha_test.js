import axios from 'axios';

async function testWaha() {
  try {
    const payload = {
      session: "default", // You'll need the actual session ID to test this correctly, but let's see the error first
      chatId: "status@broadcast", // Dummy test
      file: "https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg",
      caption: "Test Image"
    };
    
    // Using standard localhost waha port just to see if it's reachable locally and what error it throws
    const res = await axios.post("http://localhost:3000/api/sendImage", payload);
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("FAIL:", err.response?.data || err.message);
  }
}
testWaha();
