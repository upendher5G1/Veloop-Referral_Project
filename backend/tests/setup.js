process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/veloop_test';
process.env.JWT_SECRET = 'test-secret';
process.env.DISABLE_RATE_LIMIT = '1';

const { sequelize } = require('../src/models');

beforeAll(async () => {
  // sync() is used here (rather than running migrations) purely to keep
  // the test database schema trivially reproducible in CI; the real
  // migration files under /migrations are what production actually runs.
  await sequelize.sync({ force: true });

  const { RewardConfiguration } = require('../src/models');
  await RewardConfiguration.bulkCreate([
    { milestone: 15, rewardType: 'SVE', rewardAmount: 5000, active: true },
    { milestone: 20, rewardType: 'SPINS', rewardAmount: 2, active: true },
    { milestone: 30, rewardType: 'TOKENS', rewardAmount: 5000, active: true },
    { milestone: 35, rewardType: 'GEMS', rewardAmount: 10, active: true },
    { milestone: 0, rewardType: 'XP', rewardAmount: 20, active: true },
  ]);
});

afterAll(async () => {
  await sequelize.close();
});
