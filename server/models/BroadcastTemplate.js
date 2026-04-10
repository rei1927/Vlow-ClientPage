import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BroadcastTemplate = sequelize.define("BroadcastTemplate", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: "id",
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: "UTILITY",
  },
  components: {
    type: DataTypes.JSON, // Postgres JSON or JSONB if available
    defaultValue: [],
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "APPROVED",
  }
});

export default BroadcastTemplate;
