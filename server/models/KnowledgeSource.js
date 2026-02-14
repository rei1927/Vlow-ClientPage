import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const KnowledgeSource = sequelize.define("KnowledgeSource", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Default Title",
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

export default KnowledgeSource;
