const { AuditLog } = require('../models');

async function record(action, { userId = null, metadata = {}, transaction } = {}) {
  return AuditLog.create({ userId, action, metadata }, { transaction });
}

module.exports = { record };
