// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "customer"),
      defaultValue: "customer",
    },
    n8nWebhookUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    n8nSimulatorWebhookUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaCloudWebhookUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL Webhook n8n khusus untuk Meta Cloud API",
    },
    maxPlatforms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "Batas maksimal sesi Connected Platform (WAHA) yang bisa dibuat pelanggan",
    },
    subscriptionExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Tanggal berakhirnya langganan (hanya untuk customer)",
    },
    maxConversations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      comment: "Limit maksimal percakapan chat masuk/keluar untuk akun customer",
    },
    maxAiResponses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      comment: "Limit maksimal response AI yang digenerate untuk akun customer",
    },
    quotaResetDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Catatan kapan terakhir kali kuota (Conversation & AI Response) di-reset oleh Admin",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isFirstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default User;
