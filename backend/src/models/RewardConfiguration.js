const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// The milestone -> reward mapping lives here, not in code, so it can be
// changed (e.g. "15 ads now gives 6000 SVE") without a deploy.
class RewardConfiguration extends Model {}

RewardConfiguration.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    milestone: { type: DataTypes.INTEGER, allowNull: false }, // ad count, or 0 = on successful referral
    rewardType: { type: DataTypes.STRING, allowNull: false },
    rewardAmount: { type: DataTypes.INTEGER, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'RewardConfiguration',
    tableName: 'reward_configurations',
    timestamps: false,
    indexes: [{ unique: true, fields: ['milestone', 'rewardType'] }],
  }
);

module.exports = RewardConfiguration;
