const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['action'] }, { fields: ['userId'] }, { fields: ['createdAt'] }],
  }
);

module.exports = AuditLog;
