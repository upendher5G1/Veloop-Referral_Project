const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// eventId is unique so the exact same completion event, if delivered twice
// by a flaky client/provider, is detected and rejected as a duplicate
// BEFORE it ever touches ReferralProgress.
class AdEvent extends Model {}

AdEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.STRING, allowNull: false, unique: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false }, // 'dev-test' in this assignment
    status: { type: DataTypes.ENUM('VERIFIED', 'REJECTED', 'DUPLICATE'), allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'AdEvent',
    tableName: 'ad_events',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = AdEvent;
