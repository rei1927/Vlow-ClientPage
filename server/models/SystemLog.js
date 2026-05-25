import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  level: {
    type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR'),
    allowNull: false,
    defaultValue: 'INFO',
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  timestamps: true, // Will add createdAt and updatedAt
  tableName: 'SystemLogs',
  indexes: [
    { fields: ['level'] },
    { fields: ['source'] },
    { fields: ['createdAt'] }
  ]
});

export default SystemLog;
