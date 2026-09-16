const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class ReferralReward extends Model {}

ReferralReward.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referralId: { type: DataTypes.UUID, allowNull: false },
    referrerUserId: { type: DataTypes.UUID, allowNull: false },
    rewardType: { type: DataTypes.STRING, allowNull: false }, // SVE | SPINS | TOKENS | GEMS | XP
    rewardAmount: { type: DataTypes.INTEGER, allowNull: false },
    milestone: { type: DataTypes.INTEGER, allowNull: false }, // 15/20/30/35, or 0 for referral-success XP
    status: { type: DataTypes.ENUM('PENDING', 'CREDITED', 'FAILED'), defaultValue: 'PENDING' },
    creditedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'ReferralReward',
    tableName: 'referral_rewards',
    timestamps: true,
    updatedAt: false,
    indexes: [
      // THE idempotency guarantee: the DB itself refuses a second row for
      // the same referral+milestone+type. milestoneService relies on the
      // unique-constraint violation, not an application-level check, as
      // the final word on "already awarded".
      { unique: true, fields: ['referralId', 'milestone', 'rewardType'] },
      { fields: ['referrerUserId'] },
    ],
  }
);

module.exports = ReferralReward;
