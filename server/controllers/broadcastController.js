import BroadcastTemplate from "../models/BroadcastTemplate.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import axios from "axios";

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
