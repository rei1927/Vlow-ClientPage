import axios from "axios";
import AppError from "../utils/AppError.js";

// Ambil config dari .env
const WAHA_URL = process.env.WAHA_BASE_URL || "http://localhost:7575";
const API_KEY = process.env.WAHA_API_KEY;

const HEADERS = {
  "Content-Type": "application/json",
  ...(API_KEY && { "X-Api-Key": API_KEY }),
};

const getWahaSession = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/sessions/${sessionId}`, {
      headers: HEADERS,
    });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

const isRecoverableStartError = async (sessionId, error) => {
  const statusCode = error?.response?.status;
  if (!statusCode) return false;

  // Jika WAHA menolak karena sudah running / starting, anggap sukses
  if ([400, 409, 422, 500].includes(statusCode)) {
    try {
      const session = await getWahaSession(sessionId);
      if (!session) return false;
      if (["STARTING", "SCAN_QR_CODE", "WORKING"].includes(session.status)) {
        return true;
      }
    } catch (err) {
      return false;
    }

    const rawMessage = JSON.stringify(error?.response?.data || "");
    if (/already|running|started|start/i.test(rawMessage)) return true;
  }

  return false;
};

// Start Session & Inject Webhook URL
export const startWahaSession = async (sessionId, webhookUrl) => {
  try {
    // 1. Cek apakah session sudah ada
    const existingSession = await getWahaSession(sessionId);

    if (!existingSession) {
      // 2. Payload Config untuk WAHA
      const payload = {
        name: sessionId,
        config: {
          proxy: null,
          webhooks: [
            {
              url: webhookUrl, // <--- INI KUNCINYA (Dikirim ke n8n User)
              events: ["message", "session.status"],
              hmac: null,
            },
          ],
        },
      };

      // 3. Create Session
      await axios.post(`${WAHA_URL}/api/sessions`, payload, { headers: HEADERS });
    }

    // 4. Pastikan session berjalan (auto start saat STOPPED)
    try {
      await axios.post(`${WAHA_URL}/api/sessions/${sessionId}/start`, {}, { headers: HEADERS });
    } catch (error) {
      const recoverable = await isRecoverableStartError(sessionId, error);
      if (!recoverable) throw error;
    }
  } catch (error) {
    console.error("WAHA Service Error:", error?.response?.data || error.message);
    throw new AppError("Gagal menghubungkan ke Server WhatsApp Engine.", 502);
  }
};

export const getWahaScreenshot = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/screenshot`, {
      params: {
        session: sessionId,
        // Selector ini penting! Jika elemen ini belum ada, WAHA akan throw error/404
        // sehingga masuk ke catch block, dan kita return null (loading).
        selector: 'canvas[aria-label="Scan me!"]',
      },
      responseType: "arraybuffer",
      headers: HEADERS,
    });

    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Validasi tambahan: Jika string terlalu pendek, anggap gagal (bukan gambar valid)
    if (base64Image.length < 100) return null;

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    // Jangan log error heboh, cukup tahu bahwa WAHA sedang booting
    // console.log("WAHA QR not ready yet...");
    return null;
  }
};

export const getWahaStatus = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/sessions/${sessionId}`, {
      headers: HEADERS,
    });
    const status = response.data.status;

    if (status === "STOPPED" || status === "FAILED") {
      try {
        await axios.post(`${WAHA_URL}/api/sessions/${sessionId}/start`, {}, { headers: HEADERS });
      } catch (error) {
        // Abaikan error start otomatis, biar status tetap terlapor
      }
    }
    // Mapping status WAHA ke status aplikasi kita
    return status;
  } catch (error) {
    return "STOPPED";
  }
};

export const stopWahaSession = async (sessionId) => {
  try {
    await axios.post(`${WAHA_URL}/api/sessions/${sessionId}/logout`, {}, { headers: HEADERS });
  } catch (error) {
    console.error("WAHA Stop Error:", error.message);
  }
};
