const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VELOOP Rewards Referral API',
      version: '1.0.0',
      description:
        'Backend API for the VELOOP Rewards referral program: attribution, progress tracking, milestone rewards, and fraud protection.',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/docs/*.yaml'],
});

module.exports = { swaggerUi, swaggerSpec };
