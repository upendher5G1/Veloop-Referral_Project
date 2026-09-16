const { sequelize, AdEvent, Referral, ReferralProgress } = require('../models');
const { verifyCompletion } = require('./adVerificationService');
const milestoneService = require('./milestoneService');
const auditLogService = require('./auditLogService');
const { ApiError, Codes } = require('../utils/errors');

/**
 * Processes a single ad-completion event for the AUTHENTICATED user.
 *
 * Flow: verify with the (swappable) ad provider -> record the event
 * row (unique eventId catches duplicates at the DB level) -> if this is
 * the referred user in an active referral, bump ReferralProgress -> run
 * the milestone engine.
 *
 * A repeated eventId is detected BEFORE any progress/reward side effects
 * run, so redelivery of the same event is a true no-op, not just a
 * no-op on the reward step.
 */
async function processAdEvent({ userId, eventId, sessionId, timestamp, provider = 'dev-test' }) {
  return sequelize.transaction(async (transaction) => {
    const existing = await AdEvent.findOne({ where: { eventId }, transaction });
    if (existing) {
      // Duplicate delivery of an already-processed event: idempotent no-op.
      return { duplicate: true, event: existing };
    }

    const verification = await verifyCompletion(provider, { eventId, userId, sessionId, timestamp });

    if (!verification.verified) {
      const rejected = await AdEvent.create(
        { eventId, userId, provider, status: 'REJECTED', timestamp: new Date(timestamp) },
        { transaction }
      );
      await auditLogService.record('AD_EVENT_REJECTED', {
        userId,
        metadata: { eventId, reason: verification.reason },
        transaction,
      });
      throw new ApiError(422, Codes.REFERRAL_NOT_ELIGIBLE, `Ad event could not be verified: ${verification.reason}`);
    }

    const event = await AdEvent.create(
      { eventId, userId, provider, status: 'VERIFIED', timestamp: new Date(timestamp) },
      { transaction }
    );
    await auditLogService.record('AD_EVENT_VERIFIED', { userId, metadata: { eventId }, transaction });

    // Is this user the REFERRED side of an active referral? If so, their
    // verified ad-watch activity is what drives their referrer's rewards.
    const referral = await Referral.findOne({
      where: { referredUserId: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!referral || ['SPAM', 'REJECTED'].includes(referral.status)) {
      // No active referral for this user - the ad event is still recorded
      // (useful for the platform's own ad-watch systems) but does not
      // drive any referral reward.
      return { duplicate: false, event, referral: null };
    }

    const [progress] = await ReferralProgress.findOrCreate({
      where: { referralId: referral.id },
      defaults: { referralId: referral.id, referredUserId: userId, eligibleAdsWatched: 0 },
      transaction,
    });

    progress.eligibleAdsWatched += 1;
    progress.lastVerifiedAt = new Date();
    await progress.save({ transaction });

    if (referral.status === 'PENDING') {
      referral.status = 'QUALIFYING';
      await referral.save({ transaction });
    }

    const { newlyAwarded } = await milestoneService.evaluateAndAward(referral.id, transaction);

    return { duplicate: false, event, referral, progress, newlyAwarded };
  });
}

module.exports = { processAdEvent };
