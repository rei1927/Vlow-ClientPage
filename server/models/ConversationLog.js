import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ConversationLog = sequelize.define("ConversationLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  platformId: {
    type: DataTypes.UUID,
    allowNull: true, // Bisa null untuk simulator
  },
  sessionId: {
    type: DataTypes.STRING, // WAHA sessionId atau simulator sessionId
    allowNull: false,
  },
  chatId: {
    type: DataTypes.STRING, // WhatsApp chatId (nomor user)
    allowNull: false,
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isHandoff: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sentiment: {
    type: DataTypes.ENUM("positive", "neutral", "negative"),
    allowNull: true,
  },
  mode: {
    type: DataTypes.ENUM("production", "simulation"),
    defaultValue: "production",
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true, // Untuk data tambahan seperti booking, escalate reason, dll
  },
});

export default ConversationLog;
