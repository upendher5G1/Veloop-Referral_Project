const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateUniqueReferralCode, buildReferralLink } = require('../utils/referralCode');
const { recordDeviceSeen } = require('./deviceRiskService');
const auditLogService = require('./auditLogService');
const { ApiError, Codes } = require('../utils/errors');

function issueToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register({ email, phone, password, deviceSignals }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, Codes.CONFLICT, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Backend ALWAYS generates the referral code - never trusted from the client.
  const referralCode = await generateUniqueReferralCode(User);

  const user = await User.create({ email, phone: phone || null, passwordHash, referralCode });

  if (deviceSignals) {
    await recordDeviceSeen(user.id, deviceSignals);
  }

  await auditLogService.record('USER_REGISTERED', { userId: user.id, metadata: { email } });

  return {
    token: issueToken(user.id),
    user: publicUser(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, Codes.UNAUTHORIZED, 'Invalid email or password.');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, Codes.UNAUTHORIZED, 'Invalid email or password.');
  }
  return { token: issueToken(user.id), user: publicUser(user) };
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    referralCode: user.referralCode,
    referralLink: buildReferralLink(user.referralCode),
    balances: {
      sve: user.sveBalance,
      xp: user.xpBalance,
      gems: user.gemsBalance,
      tokens: user.tokensBalance,
      spins: user.spinsBalance,
    },
  };
}

module.exports = { register, login, publicUser };
