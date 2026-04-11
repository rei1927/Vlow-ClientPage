import BroadcastTemplate from "../models/BroadcastTemplate.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import axios from "axios";
import minioClient, { bucketName, getPublicFileUrl } from "../config/minio.js";
import { v4 as uuidv4 } from "uuid";

// Helper: Upload file to MinIO
const uploadToMinio = async (file) => {
  const fileName = `broadcast-${uuidv4()}-${file.originalname.replace(/\s/g, "-")}`;
  await minioClient.putObject(bucketName, fileName, file.buffer);
  return getPublicFileUrl(fileName);
};

// Fungsi untuk sync template dari Meta Business Manager
export const syncTemplates = async (req, res, next) => {
  try {
    const platform = await ConnectedPlatform.findOne({ 
      where: { provider: "meta_cloud" },
      order: [['createdAt', 'DESC']]
    });

    if (!platform || !platform.wabaId || !platform.systemUserAccessToken) {
      return res.status(400).json({ message: "Platform Meta Cloud belum dikonfigurasi. Hubungkan WABA ID dan Token terlebih dahulu." });
    }

    const { wabaId, systemUserAccessToken } = platform;
    
    // Tarik data rill dari Meta
    const response = await axios.get(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
      headers: { Authorization: `Bearer ${systemUserAccessToken}` }
    });

    const metaTemplates = response.data.data || [];

    // Bersihkan template lama agar tersinkronisasi bersih
    await BroadcastTemplate.destroy({ where: {} });

    const templatesToSave = metaTemplates.map(t => ({
      name: t.name,
      language: t.language,
      category: t.category,
      components: t.components,
      status: t.status
    }));

    if (templatesToSave.length > 0) {
      await BroadcastTemplate.bulkCreate(templatesToSave);
    }

    res.json({ message: "Templates synced successfully from Meta", count: templatesToSave.length });
  } catch (error) {
    console.error("Error syncing templates", error.response?.data || error);
    res.status(500).json({ message: "Internal server error during Meta sync", error: error.response?.data || error.message });
  }
};

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await BroadcastTemplate.findAll({ order: [['createdAt', 'DESC']] });
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const sendBroadcast = async (req, res, next) => {
  try {
    const { templateId, recipients } = req.body;
    
    if (!templateId || !recipients || !recipients.length) {
      return res.status(400).json({ message: "Invalid templateId or missing recipients" });
    }

    const template = await BroadcastTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const platform = await ConnectedPlatform.findOne({ 
      where: { provider: "meta_cloud" },
      order: [['createdAt', 'DESC']]
    });

    if (!platform || !platform.phoneNumberId || !platform.systemUserAccessToken) {
      return res.status(400).json({ message: "Platform Meta Cloud belum siap. Phone Number ID atau Token tidak tersedia." });
    }

    const { phoneNumberId, systemUserAccessToken } = platform;

    // Loop recipients and send actual API requests to Meta
    let successCount = 0;
    
    // Peringatan: Untuk produksi skala besar, proses loop await axios array ini sebaiknya pakai antrian (queue)
    for(const number of recipients) {
       try {
         await axios.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
           messaging_product: "whatsapp",
           to: number,
           type: "template",
           template: {
             name: template.name,
             language: { code: template.language } // Kita abaikan parameter placeholder secara dinamis saat ini (bisa ditambahkan nanti)
           }
         }, {
           headers: { Authorization: `Bearer ${systemUserAccessToken}` }
         });
         successCount++;
       } catch (err) {
         console.error(`Failed sending broadcast to ${number}`, err.response?.data || err.message);
       }
    }
    
    res.json({ message: `Broadcast processed. Successfully delivered to ${successCount}/${recipients.length} recipients.` });
  } catch (error) {
    console.error("Broadcast Execution Error:", error);
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, category, language, headerType, headerText, bodyText, footerText, buttons } = req.body;
    
    if (!name || !bodyText) {
      return res.status(400).json({ message: "Name dan Body Text wajib diisi" });
    }

    const platform = await ConnectedPlatform.findOne({ 
      where: { provider: "meta_cloud" },
      order: [['createdAt', 'DESC']]
    });

    if (!platform || !platform.wabaId || !platform.systemUserAccessToken) {
      return res.status(400).json({ message: "Platform Meta Cloud belum dikonfigurasi. Hubungkan WABA ID dan Token terlebih dahulu." });
    }

    const { wabaId, systemUserAccessToken } = platform;
    const appId = process.env.META_APP_ID;

    let headerHandle = null;
    let minioUrl = null;

    // Handle upload media via Meta Resumable Upload API
    if (req.file && ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) {
      if (!appId) {
        return res.status(500).json({ message: "Server misconfiguration: META_APP_ID hilang dari environment." });
      }

      // 1. Simpan di MinIO (Vlow)
      minioUrl = await uploadToMinio(req.file);

      // 2. Upload ke Meta (Resumable Uploads)
      // Step A: Inisialisasi Sesi Upload
      try {
        const sessionRes = await axios.post(`https://graph.facebook.com/v19.0/${appId}/uploads`, 
          {}, 
          {
            params: {
              file_length: req.file.size,
              file_type: req.file.mimetype,
              access_token: systemUserAccessToken
            }
          }
        );
        
        const uploadSessionId = sessionRes.data.id;

        // Step B: Upload file buffer ke Sesi tersebut
        const uploadRes = await axios.post(`https://graph.facebook.com/v19.0/${uploadSessionId}`,
          req.file.buffer,
          {
            headers: {
              "Authorization": `OAuth ${systemUserAccessToken}`,
              "file_offset": "0",
              "Content-Type": "application/octet-stream"
            }
          }
        );

        headerHandle = uploadRes.data.h;
      } catch (uploadError) {
        console.error("Meta Upload File Error:", uploadError.response?.data || uploadError.message);
        return res.status(502).json({ 
          message: "Gagal mengunggah file media ke Meta WhatsApp Cloud API.", 
          details: uploadError.response?.data?.error?.message 
        });
      }
    }

    // Bangun komponen template mengikuti standar Meta
    const components = [];
    
    // Header Component
    if (headerType === "TEXT" && headerText) {
      components.push({ type: "HEADER", format: "TEXT", text: headerText });
    } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && headerHandle) {
      components.push({
        type: "HEADER",
        format: headerType,
        example: { header_handle: [headerHandle] }
      });
    }

    // Body Component
    components.push({ type: "BODY", text: bodyText });
    
    // Footer Component
    if (footerText) {
      components.push({ type: "FOOTER", text: footerText });
    }

    // Buttons Component
    if (buttons) {
      try {
        const parsedButtons = JSON.parse(buttons);
        if (Array.isArray(parsedButtons) && parsedButtons.length > 0) {
          const buttonArray = parsedButtons.map(btn => {
            if (btn.type === 'QUICK_REPLY' && btn.text) return { type: 'QUICK_REPLY', text: btn.text };
            if (btn.type === 'URL' && btn.text && btn.url) return { type: 'URL', text: btn.text, url: btn.url };
            if (btn.type === 'PHONE_NUMBER' && btn.text && btn.phone_number) return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone_number };
            if (btn.type === 'COPY_CODE' && btn.example) return { type: 'COPY_CODE', example: btn.example };
            return null;
          }).filter(Boolean);
          
          if (buttonArray.length > 0) {
            components.push({ type: "BUTTONS", buttons: buttonArray });
          }
        }
      } catch (err) {
        console.warn("Failed to parse buttons", err);
      }
    }

    const payload = {
      name,
      category: category || "MARKETING",
      language: language || "id",
      components
    };

    // Kirim permintaan mutasi ke WhatsApp API
    const metaRes = await axios.post(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, payload, {
      headers: { Authorization: `Bearer ${systemUserAccessToken}` }
    });

    // Simpan ke DB lokal kita dengan status PENDING
    const newTemplate = await BroadcastTemplate.create({
      name,
      language: language || "id",
      category: category || "MARKETING",
      components,
      status: "PENDING"
    });

    res.status(201).json({ 
      message: "Template berhasil dibuat. Saat ini berstatus PENDING review dari Meta.", 
      data: newTemplate 
    });

  } catch (error) {
    console.error("Create template error", error.response?.data || error.message);
    res.status(500).json({ 
      message: "Gagal membuat template di Meta API", 
      details: error.response?.data?.error?.message || error.message 
    });
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.query;

    if (!id || !name) {
      return res.status(400).json({ message: "ID dan Nama template wajib disertakan." });
    }

    const platform = await ConnectedPlatform.findOne({ 
      where: { provider: "meta_cloud" },
      order: [['createdAt', 'DESC']]
    });

    if (!platform || !platform.wabaId || !platform.systemUserAccessToken) {
      return res.status(400).json({ message: "Platform Meta Cloud belum dikonfigurasi." });
    }

    const { wabaId, systemUserAccessToken } = platform;

    // Hapus di sisi Meta
    try {
      await axios.delete(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
        headers: { Authorization: `Bearer ${systemUserAccessToken}` },
        params: { name: name }
      });
    } catch (metaError) {
      console.warn(`Meta template deletion warning: ${metaError.response?.data?.error?.message || metaError.message}`);
      // Lanjut menghapus dari lokal jika memang sudah tidak ada di Meta
    }

    // Hapus dari database lokal kita
    await BroadcastTemplate.destroy({ where: { id } });

    res.json({ message: "Template berhasil dihapus." });
  } catch (error) {
    console.error("Delete template error", error);
    res.status(500).json({ message: "Terjadi kesalahan sistem saat menghapus template." });
  }
};
