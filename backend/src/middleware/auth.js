const jwt = require('jsonwebtoken');
const { ApiError, Codes } = require('../utils/errors');

/**
 * Populates req.userId from a verified JWT. This is the ONLY source of
 * identity for every private endpoint - userId is never read from the
 * request body/query/params, closing off the IDOR class of bugs the
 * assignment calls out explicitly.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, Codes.UNAUTHORIZED, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(new ApiError(401, Codes.UNAUTHORIZED, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
