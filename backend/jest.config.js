module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  testPathIgnorePatterns: ['/node_modules/'],
};
