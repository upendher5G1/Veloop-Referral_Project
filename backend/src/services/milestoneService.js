const { sequelize, Referral, ReferralProgress, ReferralReward, RewardConfiguration } = require('../models');
const { creditReward } = require('./rewardService');
const auditLogService = require('./auditLogService');

/**
 * The ONE place milestone checks happen. Callers (ad-event processing,
 * or a manual re-check on GET /referrals/:id/progress) all funnel through
 * here so reward logic is never duplicated across controllers.
 *
 * Runs entirely inside a single DB transaction with a row lock on the
 * Referral, so two concurrent calls for the same referral (e.g. a
 * duplicate ad-event delivered simultaneously) serialize instead of both
 * seeing "not yet credited" and double-crediting.
 *
 * Each reward's award is ALSO independently idempotent via the
 * (referralId, milestone, rewardType) unique constraint on
 * ReferralReward, so even outside this lock (e.g. a retried HTTP request)
 * a reward can never be issued twice.
 */
async function evaluateAndAward(referralId, outerTransaction) {
  const run = async (transaction) => {
    const referral = await Referral.findByPk(referralId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!referral) return { newlyAwarded: [] };

    const progress = await ReferralProgress.findOne({ where: { referralId }, transaction });
    if (!progress) return { newlyAwarded: [] };

    const configs = await RewardConfiguration.findAll({
      where: { active: true },
      order: [['milestone', 'ASC']],
      transaction,
    });

    const adMilestoneConfigs = configs.filter((c) => c.milestone > 0);
    const successConfig = configs.find((c) => c.milestone === 0);
    const finalMilestone = adMilestoneConfigs.length
      ? Math.max(...adMilestoneConfigs.map((c) => c.milestone))
      : null;

    const newlyAwarded = [];

    for (const config of adMilestoneConfigs) {
      if (progress.eligibleAdsWatched < config.milestone) continue;

      // eslint-disable-next-line no-await-in-loop
      const awarded = await tryAward({
        referral,
        milestone: config.milestone,
        rewardType: config.rewardType,
        amount: config.rewardAmount,
        reason: `Referral milestone: ${config.milestone} eligible ads watched`,
        transaction,
      });
      if (awarded) newlyAwarded.push(awarded);
    }

    if (
      finalMilestone !== null &&
      progress.eligibleAdsWatched >= finalMilestone &&
      referral.status !== 'SUCCESSFUL'
    ) {
      referral.status = 'SUCCESSFUL';
      referral.completedAt = new Date();
      await referral.save({ transaction });
      await auditLogService.record('REFERRAL_SUCCESSFUL', {
        userId: referral.referrerUserId,
        metadata: { referralId },
        transaction,
      });

      if (successConfig) {
        // eslint-disable-next-line no-await-in-loop
        const awarded = await tryAward({
          referral,
          milestone: 0,
          rewardType: successConfig.rewardType,
          amount: successConfig.rewardAmount,
          reason: 'Successful referral',
          transaction,
        });
        if (awarded) newlyAwarded.push(awarded);
      }
    }

    return { newlyAwarded };
  };

  if (outerTransaction) return run(outerTransaction);
  return sequelize.transaction(run);
}

/**
 * Attempts to award exactly one milestone reward. Returns the awarded
 * reward descriptor, or null if it was already credited previously
 * (detected via the unique constraint / an existing CREDITED row).
 */
async function tryAward({ referral, milestone, rewardType, amount, reason, transaction }) {
  const existing = await ReferralReward.findOne({
    where: { referralId: referral.id, milestone, rewardType },
    transaction,
  });
  if (existing && existing.status === 'CREDITED') {
    return null; // already awarded - nothing to do
  }

  const rewardRow =
    existing ||
    (await ReferralReward.create(
      {
        referralId: referral.id,
        referrerUserId: referral.referrerUserId,
        rewardType,
        rewardAmount: amount,
        milestone,
        status: 'PENDING',
      },
      { transaction }
    ));

  const idempotencyKey = `referral:${referral.id}:milestone:${milestone}:${rewardType}`;
  await creditReward(
    {
      userId: referral.referrerUserId,
      referralId: referral.id,
      rewardType,
      amount,
      reason,
      milestone,
      idempotencyKey,
    },
    transaction
  );

  rewardRow.status = 'CREDITED';
  rewardRow.creditedAt = new Date();
  await rewardRow.save({ transaction });

  await auditLogService.record('MILESTONE_REACHED', {
    userId: referral.referrerUserId,
    metadata: { referralId: referral.id, milestone, rewardType, amount },
    transaction,
  });
  await auditLogService.record('REWARD_CREDITED', {
    userId: referral.referrerUserId,
    metadata: { referralId: referral.id, milestone, rewardType, amount },
    transaction,
  });

  return { milestone, rewardType, amount };
}

module.exports = { evaluateAndAward };
