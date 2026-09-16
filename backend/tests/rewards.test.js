const { request, app, registerUser } = require('./helpers');

async function attribute(referrerCode, referredToken, deviceToken) {
  return request(app)
    .post('/api/referrals/attribute')
    .set('Authorization', `Bearer ${referredToken}`)
    .send({ referralCode: referrerCode, deviceToken });
}

function sendAdEvent(token, eventId) {
  return request(app)
    .post('/api/referrals/ad-events')
    .set('Authorization', `Bearer ${token}`)
    .send({ eventId, sessionId: `sess-${eventId}`, timestamp: new Date().toISOString() });
}

async function setupReferral(prefix) {
  const referrer = await registerUser();
  const referred = await registerUser({ deviceToken: `device-${prefix}` });
  const attrib = await attribute(referrer.user.referralCode, referred.token, `device-${prefix}`);
  return { referrer, referred, referralId: attrib.body.referralId };
}

async function getDashboard(token) {
  const res = await request(app).get('/api/referrals/me').set('Authorization', `Bearer ${token}`);
  return res.body;
}

describe('Milestone rewards', () => {
  it('CRITICAL: credits 5000 SVE exactly once at 15 ads, even if the event is replayed', async () => {
    const { referrer, referred } = await setupReferral('milestone15');

    for (let i = 1; i <= 15; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendAdEvent(referred.token, `m15-evt-${i}`);
    }

    const dashboardAfterFirst = await getDashboard(referrer.token);
    expect(dashboardAfterFirst.totalSvesEarned).toBe(5000);

    // Replay the exact same 15th event.
    const replay = await sendAdEvent(referred.token, 'm15-evt-15');
    expect(replay.body.duplicate).toBe(true);

    const dashboardAfterReplay = await getDashboard(referrer.token);
    expect(dashboardAfterReplay.totalSvesEarned).toBe(5000); // unchanged
  });

  it('CRITICAL: at 35 ads, credits every milestone reward + XP exactly once each', async () => {
    const { referrer, referred } = await setupReferral('milestone35');

    for (let i = 1; i <= 35; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendAdEvent(referred.token, `m35-evt-${i}`);
    }

    const dashboard = await getDashboard(referrer.token);
    expect(dashboard.totalSvesEarned).toBe(5000);
    expect(dashboard.totalTokensEarned).toBe(5000);
    expect(dashboard.totalGemsEarned).toBe(10);
    expect(dashboard.totalXpEarned).toBe(20);
    expect(dashboard.successfulReferrals).toBe(1);

    // Full replay of every event must not double-credit anything.
    for (let i = 1; i <= 35; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendAdEvent(referred.token, `m35-evt-${i}`);
    }
    const dashboardAfterReplay = await getDashboard(referrer.token);
    expect(dashboardAfterReplay.totalSvesEarned).toBe(5000);
    expect(dashboardAfterReplay.totalTokensEarned).toBe(5000);
    expect(dashboardAfterReplay.totalGemsEarned).toBe(10);
    expect(dashboardAfterReplay.totalXpEarned).toBe(20);
    expect(dashboardAfterReplay.successfulReferrals).toBe(1);
  });

  it('does not award a reward before its milestone is reached', async () => {
    const { referrer, referred } = await setupReferral('milestonePartial');
    for (let i = 1; i <= 14; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendAdEvent(referred.token, `mp-evt-${i}`);
    }
    const dashboard = await getDashboard(referrer.token);
    expect(dashboard.totalSvesEarned).toBe(0);
  });

  it('rejects an ad event with no session receipt (fails provider verification)', async () => {
    const referred = await registerUser();
    const res = await request(app)
      .post('/api/referrals/ad-events')
      .set('Authorization', `Bearer ${referred.token}`)
      .send({ eventId: 'no-session-evt', timestamp: new Date().toISOString() });
    expect(res.status).toBe(400); // fails zod validation (sessionId required)
  });
});

describe('Security', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/referrals/me');
    expect(res.status).toBe(401);
  });

  it("prevents a user from reading another user's referral progress (IDOR)", async () => {
    const { referralId, referrer } = await setupReferral('idor');
    const outsider = await registerUser();

    const res = await request(app)
      .get(`/api/referrals/${referralId}/progress`)
      .set('Authorization', `Bearer ${outsider.token}`);

    expect(res.status).toBe(404);

    const ownerRes = await request(app)
      .get(`/api/referrals/${referralId}/progress`)
      .set('Authorization', `Bearer ${referrer.token}`);
    expect(ownerRes.status).toBe(200);
  });

  it('rejects malformed payloads', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ referralCode: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('never returns unlimited referral lists (pagination is enforced)', async () => {
    const user = await registerUser();
    const res = await request(app)
      .get('/api/referrals?limit=9999')
      .set('Authorization', `Bearer ${user.token}`);
    // limit above the max is rejected outright rather than silently served
    expect(res.status).toBe(400);
  });
});
