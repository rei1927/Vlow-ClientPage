import axios from "axios";
import AppError from "../utils/AppError.js";

// Ambil config dari .env
const WAHA_URL = process.env.WAHA_BASE_URL || "http://localhost:7575";
const API_KEY = process.env.WAHA_API_KEY || "rahasia123";

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
          webhooks: webhookUrl ? [
            {
              url: webhookUrl, // <--- INI KUNCINYA (Dikirim ke n8n User)
              events: [
                "message.any",
                "label.deleted",
                "label.chat.added",
                "label.chat.deleted"
              ],
            },
          ] : [],
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
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error("WAHA Service Error:", rawError);
    throw new AppError(`Gagal menghubungkan ke WAHA: ${rawError}`, 400);
  }
};

export const getWahaScreenshot = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/auth/qr`, {
      responseType: "arraybuffer", // Kita minta response berupa data binary (gambar riil)
      headers: {
        ...HEADERS,
        "Accept": "image/png"
      },
      timeout: 10000,
    });

    // Jika response berhasil, ubah data binary menjadi base64 string
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    if (base64Image.length < 100) return null;

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    // 404 artinya QR code belum siap (session masih booting/STARTING)
    // 400 artinya QR code sudah di-scan (session WORKING)
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

export const deleteWahaSession = async (sessionId) => {
  try {
    await axios.delete(`${WAHA_URL}/api/sessions/${sessionId}`, { headers: HEADERS });
  } catch (error) {
    console.error("WAHA Delete Session Error:", error.message);
  }
};

// --- WAHA CHAT AND MESSAGING ---

export const getMe = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/me`, {
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error("WAHA Get Me Error:", error.message);
    return null;
  }
};

export const getLabels = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/labels`, {
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error("WAHA Get Labels Error:", error.message);
    return null; // return null to indicate failure (meaning not a WA business or unsupported)
  }
};

export const getChatsByLabel = async (sessionId, labelId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/labels/${labelId}/chats`, {
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`WAHA Get Chats by Label ${labelId} Error:`, error.message);
    return [];
  }
};

export const updateChatLabels = async (sessionId, chatId, labelId, action = "add") => {
  try {
    const encodedChatId = encodeURIComponent(chatId);

    // 1. Fetch current labels for this chat
    let currentLabels = [];
    try {
      const getRes = await axios.get(`${WAHA_URL}/api/${sessionId}/labels/chats/${encodedChatId}/`, {
        headers: HEADERS,
        timeout: 10000,
      });
      currentLabels = Array.isArray(getRes.data) ? getRes.data : [];
    } catch (err) {
      // Jika 404 atau kosong, berarti belum ada label
      if (err.response?.status !== 404) {
        console.warn("Could not fetch existing labels for chat, assuming empty.", err.message);
      }
    }

    // 2. Modify the array based on action
    let newLabelsPayload = currentLabels.map(l => ({ id: String(l.id) }));

    if (action === "add") {
      if (!newLabelsPayload.some(l => l.id === String(labelId))) {
        newLabelsPayload.push({ id: String(labelId) });
      }
    } else if (action === "remove") {
      newLabelsPayload = newLabelsPayload.filter(l => l.id !== String(labelId));
    }

    // 3. PUT the new array to overwrite
    const payload = {
      labels: newLabelsPayload
    };

    const response = await axios.put(`${WAHA_URL}/api/${sessionId}/labels/chats/${encodedChatId}/`, payload, {
      headers: HEADERS,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`WAHA ${action} Label Error:`, rawError);
    throw new AppError(`Gagal update label chat: ${rawError}`, 502);
  }
};

export const getChats = async (sessionId) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/chats`, {
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error("WAHA Get Chats Error:", rawError);
    throw new AppError(`Gagal mengambil chat: ${rawError}`, 502);
  }
};

export const getMessages = async (sessionId, chatId, limit = 50) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/${sessionId}/chats/${encodeURIComponent(chatId)}/messages`, {
      params: {
        limit: limit,
      },
      headers: HEADERS,
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error("WAHA Get Messages Error:", rawError);
    throw new AppError(`Gagal mengambil pesan: ${rawError}`, 502);
  }
};

export const sendTextMessage = async (sessionId, chatId, text) => {
  try {
    const payload = {
      session: sessionId,
      chatId: chatId,
      text: text,
    };
    const response = await axios.post(`${WAHA_URL}/api/sendText`, payload, {
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error("WAHA Send Message Error:", rawError);
    throw new AppError(`Gagal mengirim pesan: ${rawError}`, 502);
  }
};

export const createLabel = async (sessionId, name, color = 1) => {
  try {
    const payload = {
      name: name,
      color: color,
    };
    const response = await axios.post(`${WAHA_URL}/api/${sessionId}/labels`, payload, {
      headers: HEADERS,
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    const rawError = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error("WAHA Create Label Error:", rawError);
    throw new AppError(`Gagal membuat label: ${rawError}`, 502);
  }
};
