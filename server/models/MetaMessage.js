import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MetaMessage = sequelize.define("MetaMessage", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    platformId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    // Meta's unique message ID (wamid.xxx)
    waMessageId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Customer's phone number (e.g. "6287885487671")
    chatId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Contact name from Meta profile
    contactName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // true = sent by us, false = received from customer
    fromMe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Message text content
    body: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // Message type: text, image, video, audio, document, sticker, location, contacts, etc.
    type: {
        type: DataTypes.STRING,
        defaultValue: "text",
    },
    // Unix timestamp from Meta
    timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    // Message delivery status: sent, delivered, read, failed
    status: {
        type: DataTypes.STRING,
        defaultValue: "sent",
    },
});

export default MetaMessage;
