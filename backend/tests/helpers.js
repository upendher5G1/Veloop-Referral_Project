const request = require('supertest');
const app = require('../src/app');

let counter = 0;
function uniqueEmail(prefix) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.com`;
}

async function registerUser(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: uniqueEmail('user'), password: 'password123', ...overrides });
  return res.body;
}

module.exports = { app, request, registerUser, uniqueEmail };
