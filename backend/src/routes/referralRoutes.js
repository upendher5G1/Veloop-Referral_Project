const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { attributionLimiter, adEventLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/referralController');

// Note: the general rate limiter is already applied app-wide in app.js.
// Only endpoints needing a STRICTER, more specific limit get one here.

const router = express.Router();

router.use(authenticate);

router.post(
  '/attribute',
  attributionLimiter,
  validate({ body: ctrl.attributeSchema }),
  ctrl.attributeHandler
);

router.get('/me', ctrl.meHandler);

router.get('/spam', ctrl.spamHandler);

router.get('/', validate({ query: ctrl.listQuerySchema }), ctrl.listHandler);

router.get(
  '/:id/progress',
  validate({ params: ctrl.progressParamsSchema }),
  ctrl.progressHandler
);

router.post(
  '/ad-events',
  adEventLimiter,
  validate({ body: ctrl.adEventSchema }),
  ctrl.adEventHandler
);

module.exports = router;
