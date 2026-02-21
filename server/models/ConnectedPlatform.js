import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ConnectedPlatform = sequelize.define("ConnectedPlatform", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Contoh: "Admin Toko Pusat"
  },
  provider: {
    type: DataTypes.STRING,
    defaultValue: "waha",
    allowNull: false,
    validate: {
      isIn: [['waha', 'meta_cloud']]
    }
  },
  // SYSTEM GENERATED - User tidak perlu input ini
  // Ini adalah nama session unik di Server WAHA (misal: "uid_123_time_456")
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true, // Berubah jadi true karena Meta Cloud mungkin butuh / tidak butuh ID session, tapi kita pakai phoneNumberId
  },
  // --- META CLOUD API FIELDS ---
  wabaId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumberId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  systemUserAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Status koneksi real-time
  status: {
    type: DataTypes.ENUM("STOPPED", "SCANNING", "WORKING", "FAILED"),
    defaultValue: "STOPPED",
  },
  // Relasi: Agent mana yang otak-nya dipakai di nomor ini
  agentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Pemilik Platform
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

export default ConnectedPlatform;
