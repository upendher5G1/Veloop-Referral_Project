const { ApiError, Codes } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...err.extra,
    });
  }

  // Malformed JSON in the request body (thrown by express.json()) is a
  // client error, not a server fault - respond 400 instead of falling
  // through to the generic 500 handler below.
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({
      success: false,
      code: Codes.VALIDATION_ERROR,
      message: 'Malformed JSON in request body.',
    });
  }

  // Sequelize unique-constraint violations that slip past application
  // checks (race conditions) surface here - treat as a conflict rather
  // than a 500, since they represent "already exists" not a real fault.
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      code: Codes.CONFLICT,
      message: 'The requested operation conflicts with an existing record.',
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({
    success: false,
    code: Codes.INTERNAL_ERROR,
    message: 'An unexpected error occurred.',
  });
}

module.exports = { errorHandler };
