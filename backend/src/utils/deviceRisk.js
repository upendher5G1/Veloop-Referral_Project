const crypto = require('crypto');

/**
 * When a client provides no deviceToken at all, we must NOT fall back to
 * something coarse like IP address or User-Agent as a stand-in "device
 * identifier" - that would silently turn IP/UA into the device signal,
 * which is exactly the anti-pattern the assignment warns against (shared
 * IPs/UAs make unrelated users look like the same device). Instead, treat
 * a missing token as "unknown/first-time device": generate a fresh random
 * one for this attempt so it never collides with anyone else's real
 * device token. A real frontend always supplies a persisted device token
 * (e.g. from a secure cookie set at registration), so this path is only
 * hit for clients that skip that step - it fails safe (no false
 * collision) rather than failing toward false fraud flags.
 */
function resolveDeviceToken(providedToken) {
  if (providedToken && typeof providedToken === 'string' && providedToken.trim().length > 0) {
    return providedToken;
  }
  return `unknown-${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Derives a stable, non-reversible device identifier from raw client
 * signals using HMAC-SHA256. We never store the raw fingerprint - only
 * this derived hash. The secret rotates via DEVICE_HASH_SECRET so old
 * hashes can be invalidated platform-wide if ever needed.
 *
 * `signals` is intentionally minimal: a client-generated device token
 * (itself opaque, stored client-side e.g. in a secure cookie) plus coarse,
 * low-entropy attributes. We deliberately do NOT fingerprint on things
 * like full user-agent strings, installed fonts, canvas hashes, etc. -
 * that would be excessive personal/device data collection for what this
 * assignment needs.
 */
function deriveDeviceHash(signals) {
  const secret = process.env.DEVICE_HASH_SECRET || 'dev-only-device-secret';
  const normalized = JSON.stringify({
    deviceToken: signals.deviceToken || '',
    platform: signals.platform || '',
  });
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Coarse IP-network signal - we only ever use this as ONE weak input among
 * several, never as a sole basis for a fraud decision (per assignment
 * requirement #27/#39). Truncates to a /24-equivalent to avoid pinning an
 * exact client IP as a stored "risk indicator".
 */
function coarseIpNote(ip) {
  if (!ip) return null;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  return 'ipv6-or-unknown';
}

module.exports = { deriveDeviceHash, coarseIpNote, resolveDeviceToken };
