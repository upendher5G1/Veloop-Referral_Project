const { coarseIpNote } = require('../utils/deviceRisk');
const { findOtherUsersOnDevice } = require('./deviceRiskService');

/**
 * Layered fraud/self-referral risk evaluation for a referral attribution
 * attempt. Never relies on a single signal (assignment req. #27/#39) -
 * combines device association history with a coarse IP-network note.
 *
 * Returns one of:
 *   { verdict: 'CLEAR' }
 *   { verdict: 'REVIEW', riskScore, reasons }
 *   { verdict: 'BLOCK',  riskScore, reasons, associatedUserId }
 *
 * Thresholds are intentionally simple/configurable constants for this
 * assignment; a production system would tune these from real abuse data.
 */
const HIGH_CONFIDENCE_THRESHOLD = 61;
const REVIEW_THRESHOLD = 31;

async function evaluateReferralRisk({ currentUserId, referrerUserId, deviceHash, ip }) {
  const reasons = [];
  let riskScore = 0;

  // Obvious, deterministic case handled by the caller (self-referral by ID)
  // before this even runs - this function focuses on the harder,
  // device/behavioral cases.

  const otherUsersOnDevice = await findOtherUsersOnDevice(deviceHash, currentUserId);

  let associatedUserId = null;
  if (otherUsersOnDevice.length > 0) {
    riskScore += 50;
    reasons.push('device_previously_associated_with_another_account');

    if (otherUsersOnDevice.includes(referrerUserId)) {
      // The referred user's device has previously been used by the SAME
      // account that is now the referrer - a strong self-referral signal.
      riskScore += 30;
      reasons.push('device_matches_referrer_account');
      associatedUserId = referrerUserId;
    } else {
      associatedUserId = otherUsersOnDevice[0];
    }
  }

  // IP is only ever a weak, additive signal - never sufficient alone.
  const ipNote = coarseIpNote(ip);
  if (ipNote) {
    riskScore += 5;
    reasons.push('ip_network_signal_present');
  }

  if (riskScore >= HIGH_CONFIDENCE_THRESHOLD) {
    return { verdict: 'BLOCK', riskScore, reasons, associatedUserId, ipNote };
  }
  if (riskScore >= REVIEW_THRESHOLD) {
    return { verdict: 'REVIEW', riskScore, reasons, associatedUserId, ipNote };
  }
  return { verdict: 'CLEAR', riskScore, reasons, associatedUserId, ipNote };
}

module.exports = { evaluateReferralRisk, HIGH_CONFIDENCE_THRESHOLD, REVIEW_THRESHOLD };
