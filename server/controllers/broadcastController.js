import BroadcastTemplate from "../models/BroadcastTemplate.js";
import axios from "axios";

// Fungsi untuk sync template dari Meta Business Manager
export const syncTemplates = async (req, res, next) => {
  try {
    console.log("Syncing from Meta API...");
    // Mock response successful
    res.json({ message: "Templates synced successfully" });
  } catch (error) {
    console.error("Error syncing templates", error);
    next(error);
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

    // Logic broadcast sebenarnya menggunakan Meta Cloud API
    /*
    const META_TOKEN = process.env.META_ACCESS_TOKEN;
    const PHONE_ID = process.env.META_PHONE_NUMBER_ID;

    for(const number of recipients) {
       await axios.post(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
         messaging_product: "whatsapp",
         to: number,
         type: "template",
         template: {
           name: template.name,
           language: { code: template.language }
         }
       }, {
         headers: { Authorization: `Bearer ${META_TOKEN}` }
       });
    }
    */
    
    res.json({ message: `Broadcast initiated to ${recipients.length} recipients successfully` });
  } catch (error) {
    console.error("Broadcast Execution Error:", error);
    next(error);
  }
};
