const rateLimit = require('express-rate-limit');
const { Codes } = require('../utils/errors');

// Bypass only for automated tests/local smoke-testing - never set this in
// a real deployment. Production always enforces the limits below.
const skip = () => process.env.DISABLE_RATE_LIMIT === '1';

function jsonHandler(req, res) {
  res.status(429).json({
    success: false,
    code: Codes.RATE_LIMITED,
    message: 'Too many requests. Please slow down and try again shortly.',
  });
}

// express-rate-limit defaults to an in-memory store, which is fine for a
// single-instance deployment. For multi-instance production, swap the
// `store` option here for a Redis store keyed off REDIS_URL - the rest of
// the app doesn't need to change.

const attributionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  skip,
});

const adEventLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  skip,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  skip,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  skip,
});

module.exports = { attributionLimiter, adEventLimiter, authLimiter, generalLimiter };
