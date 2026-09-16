'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('reward_configurations', [
      { id: uuidv4(), milestone: 15, rewardType: 'SVE', rewardAmount: 5000, active: true },
      { id: uuidv4(), milestone: 20, rewardType: 'SPINS', rewardAmount: 2, active: true },
      { id: uuidv4(), milestone: 30, rewardType: 'TOKENS', rewardAmount: 5000, active: true },
      { id: uuidv4(), milestone: 35, rewardType: 'GEMS', rewardAmount: 10, active: true },
      { id: uuidv4(), milestone: 0, rewardType: 'XP', rewardAmount: 20, active: true },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('reward_configurations', null, {});
  },
};
