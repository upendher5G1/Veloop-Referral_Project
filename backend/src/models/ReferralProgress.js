const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// This counter is NEVER written directly from a client request. It only
// moves forward as a side effect of adEventService processing a verified
// AdEvent row - see adEventService.recordVerifiedEvent.
class ReferralProgress extends Model {}

ReferralProgress.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referralId: { type: DataTypes.UUID, allowNull: false, unique: true },
    referredUserId: { type: DataTypes.UUID, allowNull: false },
    eligibleAdsWatched: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'ReferralProgress', tableName: 'referral_progress', timestamps: true }
);

module.exports = ReferralProgress;
