const { z } = require('zod');
const authService = require('../services/authService');
const { resolveDeviceToken } = require('../utils/deviceRisk');

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  password: z.string().min(8).max(128),
  deviceToken: z.string().min(1).max(256).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

async function registerHandler(req, res, next) {
  try {
    const result = await authService.register({
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      deviceSignals: {
        deviceToken: resolveDeviceToken(req.body.deviceToken),
        platform: req.headers['user-agent'] || '',
      },
    });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function loginHandler(req, res, next) {
  try {
    const result = await authService.login({ email: req.body.email, password: req.body.password });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerHandler, loginHandler, registerSchema, loginSchema };
