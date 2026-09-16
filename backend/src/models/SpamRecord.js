const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// Internal-only fraud evidence. riskScore, deviceHash and ipRiskNote are
// NEVER returned to any client - only aggregate counts (see
// referralController.getSpam) are user-facing.
class SpamRecord extends Model {}

SpamRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referralId: { type: DataTypes.UUID, allowNull: true },
    referrerUserId: { type: DataTypes.UUID, allowNull: true },
    referredUserId: { type: DataTypes.UUID, allowNull: true },
    reason: { type: DataTypes.STRING, allowNull: false },
    deviceHash: { type: DataTypes.STRING, allowNull: true },
    ipRiskNote: { type: DataTypes.STRING, allowNull: true },
    riskScore: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('FLAGGED', 'CONFIRMED', 'CLEARED'), defaultValue: 'FLAGGED' },
  },
  {
    sequelize,
    modelName: 'SpamRecord',
    tableName: 'spam_records',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['referrerUserId'] }, { fields: ['status'] }],
  }
);

module.exports = SpamRecord;
