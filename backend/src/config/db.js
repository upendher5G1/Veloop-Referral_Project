const { Sequelize } = require('sequelize');
require('dotenv').config({ quiet: true });

// Managed Postgres hosts (Render, Neon, Supabase, RDS, etc.) require SSL and
// use certificates not in Node's default trust store, so we relax cert
// verification in production. Local development (NODE_ENV=development)
// connects to a local, unencrypted Postgres and is unaffected.
const useSSL = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? false : false,
  dialectOptions: useSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

module.exports = sequelize;
