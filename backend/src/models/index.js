const sequelize = require('../config/db');
const User = require('./User');
const UserDevice = require('./UserDevice');
const Referral = require('./Referral');
const ReferralProgress = require('./ReferralProgress');
const ReferralReward = require('./ReferralReward');
const RewardTransaction = require('./RewardTransaction');
const AdEvent = require('./AdEvent');
const SpamRecord = require('./SpamRecord');
const AuditLog = require('./AuditLog');
const RewardConfiguration = require('./RewardConfiguration');

User.hasMany(Referral, { as: 'referralsMade', foreignKey: 'referrerUserId' });
Referral.belongsTo(User, { as: 'referrer', foreignKey: 'referrerUserId' });

User.hasOne(Referral, { as: 'referralReceived', foreignKey: 'referredUserId' });
Referral.belongsTo(User, { as: 'referred', foreignKey: 'referredUserId' });

Referral.hasOne(ReferralProgress, { as: 'progress', foreignKey: 'referralId' });
ReferralProgress.belongsTo(Referral, { foreignKey: 'referralId' });

Referral.hasMany(ReferralReward, { as: 'rewards', foreignKey: 'referralId' });
ReferralReward.belongsTo(Referral, { foreignKey: 'referralId' });

Referral.hasMany(SpamRecord, { foreignKey: 'referralId' });
SpamRecord.belongsTo(Referral, { foreignKey: 'referralId' });

User.hasMany(UserDevice, { as: 'devices', foreignKey: 'userId' });
UserDevice.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(RewardTransaction, { as: 'rewardTxns', foreignKey: 'userId' });
RewardTransaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  UserDevice,
  Referral,
  ReferralProgress,
  ReferralReward,
  RewardTransaction,
  AdEvent,
  SpamRecord,
  AuditLog,
  RewardConfiguration,
};
