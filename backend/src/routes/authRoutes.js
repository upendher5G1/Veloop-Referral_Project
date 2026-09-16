const express = require('express');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/register', authLimiter, validate({ body: ctrl.registerSchema }), ctrl.registerHandler);
router.post('/login', authLimiter, validate({ body: ctrl.loginSchema }), ctrl.loginHandler);

module.exports = router;
