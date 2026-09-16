const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ quiet: true });

const authRoutes = require('./routes/authRoutes');
const referralRoutes = require('./routes/referralRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();

// Trust proxy so req.ip reflects the real client IP behind a load
// balancer/reverse proxy in production deployments.
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/tests).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { skip: () => process.env.NODE_ENV === 'test' }));
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);

if (process.env.NODE_ENV !== 'test') {
  // Swagger UI - see src/config/swagger.js
  // eslint-disable-next-line global-require
  const { swaggerUi, swaggerSpec } = require('./config/swagger');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
