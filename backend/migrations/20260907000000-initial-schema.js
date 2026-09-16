'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('users', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone: { type: DataTypes.STRING, allowNull: true, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      referralCode: { type: DataTypes.STRING, allowNull: false, unique: true },
      sveBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
      xpBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
      gemsBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
      tokensBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
      spinsBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('user_devices', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      deviceHash: { type: DataTypes.STRING, allowNull: false },
      firstSeenAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      trustScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    });
    await queryInterface.addIndex('user_devices', ['deviceHash']);
    await queryInterface.addIndex('user_devices', ['userId']);

    await queryInterface.createTable('referrals', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referrerUserId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      referredUserId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
      referralCode: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('PENDING', 'QUALIFYING', 'SUCCESSFUL', 'SPAM', 'REJECTED', 'FRAUD_REVIEW'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      attributionSource: { type: DataTypes.STRING, defaultValue: 'link' },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('referrals', ['referrerUserId']);
    await queryInterface.addIndex('referrals', ['status']);
    await queryInterface.addIndex('referrals', ['createdAt']);

    await queryInterface.createTable('referral_progress', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referralId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'referrals', key: 'id' } },
      referredUserId: { type: DataTypes.UUID, allowNull: false },
      eligibleAdsWatched: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastVerifiedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('referral_rewards', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referralId: { type: DataTypes.UUID, allowNull: false, references: { model: 'referrals', key: 'id' } },
      referrerUserId: { type: DataTypes.UUID, allowNull: false },
      rewardType: { type: DataTypes.STRING, allowNull: false },
      rewardAmount: { type: DataTypes.INTEGER, allowNull: false },
      milestone: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('PENDING', 'CREDITED', 'FAILED'), defaultValue: 'PENDING' },
      creditedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('referral_rewards', ['referralId', 'milestone', 'rewardType'], {
      unique: true,
      name: 'referral_rewards_unique_milestone',
    });
    await queryInterface.addIndex('referral_rewards', ['referrerUserId']);

    await queryInterface.createTable('reward_transactions', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      idempotencyKey: { type: DataTypes.STRING, allowNull: false, unique: true },
      userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      referralId: { type: DataTypes.UUID, allowNull: true },
      rewardType: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: false },
      milestone: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.ENUM('PENDING', 'CREDITED', 'FAILED'), defaultValue: 'CREDITED' },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('reward_transactions', ['userId']);
    await queryInterface.addIndex('reward_transactions', ['referralId']);

    await queryInterface.createTable('ad_events', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      eventId: { type: DataTypes.STRING, allowNull: false, unique: true },
      userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      provider: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.ENUM('VERIFIED', 'REJECTED', 'DUPLICATE'), allowNull: false },
      timestamp: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('ad_events', ['userId']);

    await queryInterface.createTable('spam_records', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referralId: { type: DataTypes.UUID, allowNull: true, references: { model: 'referrals', key: 'id' } },
      referrerUserId: { type: DataTypes.UUID, allowNull: true },
      referredUserId: { type: DataTypes.UUID, allowNull: true },
      reason: { type: DataTypes.STRING, allowNull: false },
      deviceHash: { type: DataTypes.STRING, allowNull: true },
      ipRiskNote: { type: DataTypes.STRING, allowNull: true },
      riskScore: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('FLAGGED', 'CONFIRMED', 'CLEARED'), defaultValue: 'FLAGGED' },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('spam_records', ['referrerUserId']);
    await queryInterface.addIndex('spam_records', ['status']);

    await queryInterface.createTable('audit_logs', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      action: { type: DataTypes.STRING, allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);

    await queryInterface.createTable('reward_configurations', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      milestone: { type: DataTypes.INTEGER, allowNull: false },
      rewardType: { type: DataTypes.STRING, allowNull: false },
      rewardAmount: { type: DataTypes.INTEGER, allowNull: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    });
    await queryInterface.addIndex('reward_configurations', ['milestone', 'rewardType'], {
      unique: true,
      name: 'reward_configurations_unique_milestone_type',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reward_configurations');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('spam_records');
    await queryInterface.dropTable('ad_events');
    await queryInterface.dropTable('reward_transactions');
    await queryInterface.dropTable('referral_rewards');
    await queryInterface.dropTable('referral_progress');
    await queryInterface.dropTable('referrals');
    await queryInterface.dropTable('user_devices');
    await queryInterface.dropTable('users');
  },
};
