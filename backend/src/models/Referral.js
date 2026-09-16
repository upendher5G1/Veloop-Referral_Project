const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

const STATUSES = ['PENDING', 'QUALIFYING', 'SUCCESSFUL', 'SPAM', 'REJECTED', 'FRAUD_REVIEW'];

class Referral extends Model {}

Referral.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referrerUserId: { type: DataTypes.UUID, allowNull: false },
    // UNIQUE is what makes attribution immutable: a referred user can only
    // ever own one row here. See referralService.attribute for the
    // "already has a referrer" check this enforces at the DB level too.
    referredUserId: { type: DataTypes.UUID, allowNull: false, unique: true },
    referralCode: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUSES), defaultValue: 'PENDING' },
    attributionSource: { type: DataTypes.STRING, defaultValue: 'link' },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Referral',
    tableName: 'referrals',
    timestamps: true,
    indexes: [{ fields: ['referrerUserId'] }, { fields: ['status'] }, { fields: ['createdAt'] }],
  }
);

module.exports = Referral;
module.exports.STATUSES = STATUSES;
