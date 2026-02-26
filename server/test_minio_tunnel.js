import axios from 'axios';
const test = async () => {
  try {
     const start = Date.now();
     const res = await axios.get("https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg", { timeout: 8000 });
     console.log("Success! Status:", res.status, "Time:", Date.now() - start, "ms");
  } catch(e) {
     console.error("FAIL:", e.message);
  }
}
test();
