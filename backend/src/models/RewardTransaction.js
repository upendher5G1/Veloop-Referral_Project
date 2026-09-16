const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

// The append-only ledger. Every balance change must have exactly one row
// here. idempotencyKey is unique so a retried/duplicated request (whether
// from the ad-event flow or a client Idempotency-Key header) can never
// create a second credit.
class RewardTransaction extends Model {}

RewardTransaction.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    idempotencyKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    referralId: { type: DataTypes.UUID, allowNull: true },
    rewardType: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    milestone: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM('PENDING', 'CREDITED', 'FAILED'), defaultValue: 'CREDITED' },
  },
  {
    sequelize,
    modelName: 'RewardTransaction',
    tableName: 'reward_transactions',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['userId'] }, { fields: ['referralId'] }],
  }
);

module.exports = RewardTransaction;
