import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ChatHandover = sequelize.define("ChatHandover", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    chatId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "WhatsApp chat ID (e.g. 628123456789@c.us)",
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "WAHA session ID",
    },
    platformId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    agentId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("ai", "human"),
        defaultValue: "ai",
    },
    triggeredBy: {
        type: DataTypes.ENUM("manual", "auto_keyword", "ai_escalate"),
        allowNull: true,
    },
    triggerKeyword: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "The keyword that triggered auto handover",
    },
    autoReleaseAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When this handover should auto-release back to AI",
    },
    activatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    releasedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
});

export default ChatHandover;
