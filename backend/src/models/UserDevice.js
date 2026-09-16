const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// Records an HMAC-derived device fingerprint seen for a user. The SAME
// deviceHash appearing under a different userId is the core signal the
// fraud/device-risk service watches for (see fraudDetectionService).
class UserDevice extends Model {}

UserDevice.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    deviceHash: { type: DataTypes.STRING, allowNull: false },
    firstSeenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    lastSeenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    trustScore: { type: DataTypes.INTEGER, defaultValue: 0 }, // internal only
  },
  {
    sequelize,
    modelName: 'UserDevice',
    tableName: 'user_devices',
    timestamps: false,
    indexes: [{ fields: ['deviceHash'] }, { fields: ['userId'] }],
  }
);

module.exports = UserDevice;
