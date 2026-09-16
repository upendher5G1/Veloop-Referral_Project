const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid ambiguity

function generateCandidate(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/**
 * Generates a unique referral code by checking against the DB and retrying
 * on collision (extremely unlikely at this alphabet/length, but the
 * assignment explicitly requires collision handling to be safe).
 */
async function generateUniqueReferralCode(User, { maxAttempts = 5 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateCandidate();
    // eslint-disable-next-line no-await-in-loop
    const existing = await User.findOne({ where: { referralCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique referral code after multiple attempts');
}

function buildReferralLink(referralCode) {
  const base = process.env.REFERRAL_BASE_URL || 'https://www.velooprewards.in/register';
  return `${base}?ref=${referralCode}`;
}

module.exports = { generateUniqueReferralCode, buildReferralLink, generateCandidate };
