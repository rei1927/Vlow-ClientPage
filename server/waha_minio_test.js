import axios from 'axios';

const payload = {
  chatId: "status@broadcast", // broadcast for testing
  file: {
    mimetype: "image/jpeg",
    filename: "b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg",
    url: "https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg"
  },
  caption: "Test Minio Download"
};

// Trying default WAHA url on the vps. Since WAHA doesn't have auth by default in some setups, we'll try basic endpoint
async function test() {
    try {
        console.log("Sending payload:", JSON.stringify(payload, null, 2));
        const res = await axios.post("https://waha.dayamedialangit.co.id/api/sendImage", payload, {
            headers: {
                // User's n8n workflow uses header X-Api-Key but we don't know it, trying without or with dummy
            },
            timeout: 10000
        });
        console.log("SUCCESS:", res.data);
    } catch(err) {
        if(err.response) {
            console.error("FAIL WAHA Response:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("FAIL Network:", err.message);
        }
    }
}
test();
