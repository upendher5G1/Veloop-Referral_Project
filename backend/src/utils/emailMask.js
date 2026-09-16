/**
 * Masks an email's local part for safe display in fraud/self-referral
 * responses. Rules (as specified by the assignment):
 *  - local part length >= 7: show first 4 chars + '***' + last 3 chars
 *  - local part length <= 6 (short): show first 2 chars + '***' (nothing
 *    from the end, to avoid revealing too much of a short string)
 *  - domain is always preserved as-is
 *
 * Examples:
 *   ayanalam@example.com -> ayan***lam@example.com
 *   abc@gmail.com         -> ab***@gmail.com
 */
function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new TypeError('maskEmail expects a valid email string');
  }

  const [local, domain] = email.split('@');

  if (local.length <= 6) {
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  const start = local.slice(0, 4);
  const end = local.slice(-3);
  return `${start}***${end}@${domain}`;
}

module.exports = { maskEmail };
