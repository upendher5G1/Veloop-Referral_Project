const { z } = require('zod');
const referralService = require('../services/referralService');
const adEventService = require('../services/adEventService');
const { resolveDeviceToken } = require('../utils/deviceRisk');

const attributeSchema = z.object({
  referralCode: z.string().min(4).max(20),
  deviceToken: z.string().min(1).max(256).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['all', 'successful', 'pending', 'spam']).default('all'),
});

const progressParamsSchema = z.object({
  id: z.string().uuid(),
});

const adEventSchema = z.object({
  eventId: z.string().min(1).max(128),
  sessionId: z.string().min(1).max(128),
  timestamp: z.string().datetime().or(z.string().min(1)),
  provider: z.string().default('dev-test'),
});

async function attributeHandler(req, res, next) {
  try {
    const { referral, status } = await referralService.attribute({
      currentUserId: req.userId,
      referralCode: req.body.referralCode,
      deviceSignals: {
        deviceToken: resolveDeviceToken(req.body.deviceToken),
        platform: req.headers['user-agent'] || '',
      },
      ip: req.ip,
    });
    res.status(201).json({
      success: true,
      referralId: referral.id,
      status,
    });
  } catch (err) {
    next(err);
  }
}

async function meHandler(req, res, next) {
  try {
    const dashboard = await referralService.getDashboard(req.userId);
    res.json({ success: true, ...dashboard });
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const result = await referralService.listReferrals(req.userId, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function progressHandler(req, res, next) {
  try {
    const result = await referralService.getProgress(req.userId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function spamHandler(req, res, next) {
  try {
    const result = await referralService.getSpamSummary(req.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function adEventHandler(req, res, next) {
  try {
    const result = await adEventService.processAdEvent({
      userId: req.userId,
      eventId: req.body.eventId,
      sessionId: req.body.sessionId,
      timestamp: req.body.timestamp,
      provider: req.body.provider,
    });
    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: !!result.duplicate,
      eligibleAdsWatched: result.progress?.eligibleAdsWatched,
      newlyAwarded: result.newlyAwarded || [],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  attributeHandler,
  meHandler,
  listHandler,
  progressHandler,
  spamHandler,
  adEventHandler,
  attributeSchema,
  listQuerySchema,
  progressParamsSchema,
  adEventSchema,
};
