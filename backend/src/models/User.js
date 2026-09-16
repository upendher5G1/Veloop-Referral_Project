const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    referralCode: { type: DataTypes.STRING, allowNull: false, unique: true },

    // Cached, read-optimized balances. These are ONLY ever written inside
    // the same DB transaction as a RewardTransaction ledger row - see
    // rewardService.creditReward. Never trust/accept these from a client.
    sveBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
    xpBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
    gemsBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
    tokensBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
    spinsBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { sequelize, modelName: 'User', tableName: 'users', timestamps: true }
);

module.exports = User;
