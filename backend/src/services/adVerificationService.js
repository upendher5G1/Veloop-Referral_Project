/**
 * Abstraction boundary for ad-completion verification. The assignment
 * explicitly forbids trusting a client-supplied "adsWatched: 35" style
 * payload, but also has no real ad-provider SDK to integrate with. This
 * module defines the interface a real provider (AdMob, Unity Ads, etc.)
 * would implement, and ships a clearly-labelled development/test provider
 * so the rest of the system (idempotency, milestone engine, rewards) can
 * be built and tested against something real today.
 *
 * To go to production: implement `verifyCompletion` against the real
 * provider's server-to-server callback/verification API (most ad
 * networks provide one specifically to prevent client-side spoofing),
 * and swap DEV_PROVIDER for it below. Nothing else in the ad-event flow
 * needs to change.
 */

/**
 * dev-test provider: treats any event as "verified" as long as it carries
 * a plausible session context AND the timestamp is not absurdly far from
 * now (crude replay-window check). This is NOT a security control - it
 * exists purely so local/dev/testing can exercise the rest of the
 * pipeline without a real ad SDK.
 */
async function devTestVerify({ eventId, userId, sessionId, timestamp }) {
  if (!eventId || !userId) {
    return { verified: false, reason: 'missing_required_fields' };
  }

  const eventTime = new Date(timestamp).getTime();
  if (Number.isNaN(eventTime)) {
    return { verified: false, reason: 'invalid_timestamp' };
  }

  const ageMs = Date.now() - eventTime;
  const FIVE_MINUTES = 5 * 60 * 1000;
  if (ageMs < -FIVE_MINUTES || ageMs > FIVE_MINUTES) {
    return { verified: false, reason: 'timestamp_outside_acceptable_window' };
  }

  // A real provider would additionally verify a signed callback/receipt
  // (sessionId here stands in for that receipt) against its own servers.
  if (!sessionId) {
    return { verified: false, reason: 'missing_session_receipt' };
  }

  return { verified: true, provider: 'dev-test' };
}

const PROVIDERS = {
  'dev-test': devTestVerify,
};

async function verifyCompletion(providerName, payload) {
  const provider = PROVIDERS[providerName];
  if (!provider) {
    return { verified: false, reason: 'unknown_provider' };
  }
  return provider(payload);
}

module.exports = { verifyCompletion };
