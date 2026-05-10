import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import ConnectedPlatform from "./ConnectedPlatform.js";

const CustomerProfile = sequelize.define("CustomerProfile", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    platformId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: ConnectedPlatform,
            key: "id",
        },
        onDelete: "CASCADE",
    },
    // The phone number or Meta ID
    chatId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Extracted custom name (overrides original name)
    customName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Extracted requirements from chat
    requirements: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['platformId', 'chatId']
        }
    ]
});

// Relationships
ConnectedPlatform.hasMany(CustomerProfile, { foreignKey: "platformId", as: "customerProfiles" });
CustomerProfile.belongsTo(ConnectedPlatform, { foreignKey: "platformId", as: "platform" });

export default CustomerProfile;
