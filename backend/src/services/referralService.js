const { sequelize, User, Referral, ReferralProgress, ReferralReward, RewardTransaction, SpamRecord } = require('../models');
const { evaluateReferralRisk } = require('./fraudDetectionService');
const { recordDeviceSeen } = require('./deviceRiskService');
const auditLogService = require('./auditLogService');
const { buildReferralLink } = require('../utils/referralCode');
const { maskEmail } = require('../utils/emailMask');
const { ApiError, Codes } = require('../utils/errors');
const { Op } = require('sequelize');

/**
 * Attributes a referral: the current authenticated user is claiming they
 * were referred by `referralCode`. This is the single most
 * security-sensitive operation in the system - every check here maps
 * directly to a requirement in the assignment.
 */
async function attribute({ currentUserId, referralCode, deviceSignals, ip }) {
  return sequelize.transaction(async (transaction) => {
    const referrer = await User.findOne({ where: { referralCode }, transaction });
    if (!referrer) {
      throw new ApiError(400, Codes.INVALID_REFERRAL_CODE, 'This referral code does not exist.');
    }

    // Rule: current user cannot refer themselves (deterministic ID check).
    if (referrer.id === currentUserId) {
      await auditLogService.record('SELF_REFERRAL_DETECTED', {
        userId: currentUserId,
        metadata: { reason: 'same_account_id' },
        transaction,
      });
      throw new ApiError(400, Codes.SELF_REFERRAL_DETECTED, 'You cannot refer yourself.');
    }

    // Rule: a referred user can only ever have ONE referrer, and it is
    // immutable once set. The DB unique constraint on referredUserId is
    // the ultimate backstop; this check gives a clean error before we'd
    // hit that constraint.
    const existingReferral = await Referral.findOne({ where: { referredUserId: currentUserId }, transaction });
    if (existingReferral) {
      throw new ApiError(409, Codes.REFERRAL_ALREADY_ASSIGNED, 'You already have a referrer on file.');
    }

    const deviceHash = await recordDeviceSeen(currentUserId, deviceSignals, transaction);
    const risk = await evaluateReferralRisk({
      currentUserId,
      referrerUserId: referrer.id,
      deviceHash,
      ip,
    });

    if (risk.verdict === 'BLOCK') {
      const referral = await Referral.create(
        {
          referrerUserId: referrer.id,
          referredUserId: currentUserId,
          referralCode,
          status: 'SPAM',
        },
        { transaction }
      );
      await SpamRecord.create(
        {
          referralId: referral.id,
          referrerUserId: referrer.id,
          referredUserId: currentUserId,
          reason: risk.reasons.join(','),
          deviceHash,
          ipRiskNote: risk.ipNote,
          riskScore: risk.riskScore,
          status: 'CONFIRMED',
        },
        { transaction }
      );
      await auditLogService.record('REFERRAL_MARKED_SPAM', {
        userId: currentUserId,
        metadata: { referralId: referral.id, riskScore: risk.riskScore },
        transaction,
      });

      // If the block was driven by a device match to an existing account,
      // surface a masked email for that account per the spec's
      // SELF_REFERRAL_DETECTED response shape - but only when we have a
      // sufficiently confident associated account.
      let maskedEmail;
      if (risk.associatedUserId) {
        const associated = await User.findByPk(risk.associatedUserId, { transaction });
        if (associated) maskedEmail = maskEmail(associated.email);
      }

      throw new ApiError(
        403,
        Codes.SELF_REFERRAL_DETECTED,
        'This device has already been associated with a VELOOP Rewards account. Please use that account to log in.',
        maskedEmail ? { maskedEmail } : {}
      );
    }

    const status = risk.verdict === 'REVIEW' ? 'FRAUD_REVIEW' : 'PENDING';

    const referral = await Referral.create(
      {
        referrerUserId: referrer.id,
        referredUserId: currentUserId,
        referralCode,
        status,
      },
      { transaction }
    );

    await ReferralProgress.create(
      { referralId: referral.id, referredUserId: currentUserId, eligibleAdsWatched: 0 },
      { transaction }
    );

    if (status === 'FRAUD_REVIEW') {
      await SpamRecord.create(
        {
          referralId: referral.id,
          referrerUserId: referrer.id,
          referredUserId: currentUserId,
          reason: risk.reasons.join(',') || 'ambiguous_risk_signals',
          deviceHash,
          ipRiskNote: risk.ipNote,
          riskScore: risk.riskScore,
          status: 'FLAGGED',
        },
        { transaction }
      );
    }

    await auditLogService.record('REFERRAL_CREATED', {
      userId: currentUserId,
      metadata: { referralId: referral.id, referrerUserId: referrer.id, status },
      transaction,
    });

    return { referral, status };
  });
}

/**
 * Aggregates everything the dashboard needs, computed ENTIRELY from
 * database records/ledger - never from client-supplied values.
 */
async function getDashboard(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, Codes.NOT_FOUND, 'User not found.');

  const referrals = await Referral.findAll({
    where: { referrerUserId: userId },
    include: [{ model: ReferralProgress, as: 'progress' }],
    order: [['createdAt', 'DESC']],
  });

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter((r) => r.status === 'SUCCESSFUL').length;
  const pendingReferrals = referrals.filter((r) => ['PENDING', 'QUALIFYING'].includes(r.status)).length;
  const spamReferrals = referrals.filter((r) => ['SPAM', 'FRAUD_REVIEW'].includes(r.status)).length;

  const earnedByType = await RewardTransaction.findAll({
    where: { userId, status: 'CREDITED' },
    attributes: ['rewardType', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    group: ['rewardType'],
    raw: true,
  });
  const totals = { SVE: 0, XP: 0, GEMS: 0, TOKENS: 0, SPINS: 0 };
  earnedByType.forEach((row) => {
    totals[row.rewardType] = parseInt(row.total, 10) || 0;
  });

  const rewardMilestones = await ReferralReward.findAll({
    where: { referrerUserId: userId },
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  return {
    referralCode: user.referralCode,
    referralLink: buildReferralLink(user.referralCode),
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    spamReferrals,
    totalSvesEarned: totals.SVE,
    totalXpEarned: totals.XP,
    totalGemsEarned: totals.GEMS,
    totalTokensEarned: totals.TOKENS,
    totalSpinsEarned: totals.SPINS,
    referralProgress: referrals.slice(0, 5).map(publicReferralView),
    rewardMilestones: rewardMilestones.map((r) => ({
      milestone: r.milestone,
      rewardType: r.rewardType,
      rewardAmount: r.rewardAmount,
      status: r.status,
      creditedAt: r.creditedAt,
    })),
    recentReferrals: referrals.slice(0, 10).map(publicReferralView),
  };
}

/**
 * Paginated referral list with optional status filter. Never returns an
 * unbounded result set.
 */
async function listReferrals(userId, { page = 1, limit = 20, status }) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);

  const where = { referrerUserId: userId };
  if (status && status !== 'all') {
    if (status === 'spam') where.status = { [Op.in]: ['SPAM', 'FRAUD_REVIEW'] };
    else if (status === 'pending') where.status = { [Op.in]: ['PENDING', 'QUALIFYING'] };
    else if (status === 'successful') where.status = 'SUCCESSFUL';
  }

  const { rows, count } = await Referral.findAndCountAll({
    where,
    include: [{ model: ReferralProgress, as: 'progress' }],
    order: [['createdAt', 'DESC']],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  });

  return {
    page: safePage,
    limit: safeLimit,
    total: count,
    totalPages: Math.ceil(count / safeLimit),
    referrals: rows.map(publicReferralView),
  };
}

/**
 * Authorization-scoped progress lookup: only returns data for a referral
 * the requesting user actually owns (as referrer), and never exposes
 * anything about the referred user beyond aggregate progress.
 */
async function getProgress(userId, referralId) {
  const referral = await Referral.findOne({
    where: { id: referralId, referrerUserId: userId },
    include: [{ model: ReferralProgress, as: 'progress' }, { model: ReferralReward, as: 'rewards' }],
  });
  if (!referral) throw new ApiError(404, Codes.NOT_FOUND, 'Referral not found.');

  return {
    referralId: referral.id,
    status: referral.status,
    eligibleAdsWatched: referral.progress?.eligibleAdsWatched ?? 0,
    milestonesReached: referral.rewards.filter((r) => r.status === 'CREDITED').map((r) => r.milestone),
    milestonesRemaining: referral.rewards.filter((r) => r.status !== 'CREDITED').map((r) => r.milestone),
    rewards: referral.rewards.map((r) => ({
      milestone: r.milestone,
      rewardType: r.rewardType,
      rewardAmount: r.rewardAmount,
      status: r.status,
    })),
  };
}

async function getSpamSummary(userId) {
  const spamCount = await Referral.count({
    where: { referrerUserId: userId, status: { [Op.in]: ['SPAM', 'FRAUD_REVIEW'] } },
  });
  const recentSpam = await Referral.findAll({
    where: { referrerUserId: userId, status: { [Op.in]: ['SPAM', 'FRAUD_REVIEW'] } },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'status', 'createdAt'],
  });
  return { spamCount, recentSpam: recentSpam.map((r) => ({ id: r.id, status: r.status, createdAt: r.createdAt })) };
}

/** Strips anything private about the referred user before returning. */
function publicReferralView(referral) {
  return {
    id: referral.id,
    status: referral.status,
    eligibleAdsWatched: referral.progress?.eligibleAdsWatched ?? 0,
    createdAt: referral.createdAt,
    completedAt: referral.completedAt,
  };
}

module.exports = { attribute, getDashboard, listReferrals, getProgress, getSpamSummary };
