require('dotenv').config({ quiet: true });

const url = process.env.DATABASE_URL;

// Managed Postgres hosts require SSL with a cert not in Node's default trust
// store; relax verification for the production migration/seed environment.
const sslDialectOptions = { ssl: { require: true, rejectUnauthorized: false } };

module.exports = {
  development: { url, dialect: 'postgres' },
  test: { url: process.env.TEST_DATABASE_URL || url, dialect: 'postgres' },
  production: { url, dialect: 'postgres', dialectOptions: sslDialectOptions },
};