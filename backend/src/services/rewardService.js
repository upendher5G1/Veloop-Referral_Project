const { sequelize, User, RewardTransaction } = require('../models');

const BALANCE_FIELD_BY_TYPE = {
  SVE: 'sveBalance',
  XP: 'xpBalance',
  GEMS: 'gemsBalance',
  TOKENS: 'tokensBalance',
  SPINS: 'spinsBalance',
};

/**
 * Credits a reward atomically: ledger row + balance update happen in the
 * SAME transaction, and are guarded by RewardTransaction.idempotencyKey
 * being unique. If a row with this key already exists, the existing
 * transaction is returned instead of crediting again - callers can safely
 * retry.
 *
 * This function does NOT decide *whether* a reward is owed - that's
 * milestoneService's job. It only ever performs the actual credit, exactly
 * once per idempotencyKey.
 */
async function creditReward({ userId, referralId, rewardType, amount, reason, milestone, idempotencyKey }, outerTransaction) {
  const balanceField = BALANCE_FIELD_BY_TYPE[rewardType];
  if (!balanceField) {
    throw new Error(`Unknown reward type: ${rewardType}`);
  }

  const run = async (transaction) => {
    const existing = await RewardTransaction.findOne({ where: { idempotencyKey }, transaction });
    if (existing) {
      return { transaction: existing, created: false };
    }

    const txn = await RewardTransaction.create(
      { idempotencyKey, userId, referralId, rewardType, amount, reason, milestone, status: 'CREDITED' },
      { transaction }
    );

    await User.increment(balanceField, { by: amount, where: { id: userId }, transaction });

    return { transaction: txn, created: true };
  };

  if (outerTransaction) return run(outerTransaction);
  return sequelize.transaction(run);
}

module.exports = { creditReward, BALANCE_FIELD_BY_TYPE };
