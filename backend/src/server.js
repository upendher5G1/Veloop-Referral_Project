require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

async function start() {
  await sequelize.authenticate();
  // eslint-disable-next-line no-console
  console.log('Database connection established.');

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`VELOOP referral backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
