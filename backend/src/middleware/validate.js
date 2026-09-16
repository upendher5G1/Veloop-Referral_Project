const { ApiError, Codes } = require('../utils/errors');

/**
 * Usage: validate({ body: someZodSchema, query: otherSchema, params: ... })
 * Replaces req.body/query/params with the parsed (and thus type-coerced,
 * whitelisted) result so downstream code never touches raw input.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      next(
        new ApiError(400, Codes.VALIDATION_ERROR, 'Request validation failed', {
          issues: err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message })),
        })
      );
    }
  };
}

module.exports = { validate };
