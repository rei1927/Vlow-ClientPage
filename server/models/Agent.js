import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Agent = sequelize.define("Agent", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // --- AI BRAIN (General Tab) ---
  systemInstruction: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: "Kamu adalah asisten virtual yang membantu.",
  },
  knowledgeBase: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Penyimpanan teks / referensi RAG / link file MinIO untuk wawasan AI",
  },
  // --- WELCOME MESSAGE ---
  welcomeMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  welcomeImageUrl: {
    type: DataTypes.STRING, // URL gambar dari MinIO
    allowNull: true,
  },
  // --- TRANSFER CONDITIONS (Legacy) ---
  transferCondition: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // --- HUMAN HANDOVER CONFIG ---
  handoverConfig: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      enabled: false,
      keywords: [],
      responseMessage: "Baik, saya akan menghubungkan Anda dengan tim kami. Mohon tunggu sebentar.",
      autoReleaseMinutes: 30,
      handoverLabelId: null,
      aiLabelId: null,
    },
  },
  followupConfig: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      isEnabled: false,
      delay: 15, // Default 15
      unit: "minutes", // 'minutes' | 'hours'
      prompt: "Halo, apakah ada yang bisa saya bantu lagi?", // Default prompt
    },
  },
  // --- INTEGRATION ---
  whatsappNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    // Note: Kita handle uniqueness di logic controller agar aman saat sync
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

export default Agent;
