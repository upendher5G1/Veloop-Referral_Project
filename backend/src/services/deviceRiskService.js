const { UserDevice } = require('../models');
const { deriveDeviceHash } = require('../utils/deviceRisk');

/**
 * Records that a device (identified by client-supplied signals) has been
 * seen for a given user. Called on registration and on referral
 * attribution so history accumulates over time.
 */
async function recordDeviceSeen(userId, signals, transaction) {
  const deviceHash = deriveDeviceHash(signals);
  const [device] = await UserDevice.findOrCreate({
    where: { userId, deviceHash },
    defaults: { userId, deviceHash },
    transaction,
  });
  if (device) {
    device.lastSeenAt = new Date();
    await device.save({ transaction });
  }
  return deviceHash;
}

/**
 * Returns the set of OTHER userIds that have ever used this exact device
 * hash. An empty array means this looks like a first-time device.
 */
async function findOtherUsersOnDevice(deviceHash, excludingUserId) {
  const rows = await UserDevice.findAll({ where: { deviceHash } });
  return [...new Set(rows.map((r) => r.userId).filter((id) => id !== excludingUserId))];
}

module.exports = { recordDeviceSeen, findOtherUsersOnDevice };
