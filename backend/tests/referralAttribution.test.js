const { request, app, registerUser } = require('./helpers');

describe('Referral attribution', () => {
  it('creates a valid PENDING referral for a legitimate, distinct-device attempt', async () => {
    const referrer = await registerUser();
    const referred = await registerUser({ deviceToken: 'device-valid-1' });

    const res = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${referred.token}`)
      .send({ referralCode: referrer.user.referralCode, deviceToken: 'device-valid-1' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
  });

  it('rejects an invalid referral code', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ referralCode: 'NOTAREALCODE' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REFERRAL_CODE');
  });

  it('rejects self-referral by matching account ID', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ referralCode: user.user.referralCode });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SELF_REFERRAL_DETECTED');
  });

  it('prevents a duplicate referral: attribution is immutable once set', async () => {
    const referrerX = await registerUser();
    const referrerY = await registerUser();
    const referred = await registerUser({ deviceToken: 'device-immutable-1' });

    const first = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${referred.token}`)
      .send({ referralCode: referrerX.user.referralCode, deviceToken: 'device-immutable-1' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${referred.token}`)
      .send({ referralCode: referrerY.user.referralCode, deviceToken: 'device-immutable-1' });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe('REFERRAL_ALREADY_ASSIGNED');
  });

  it('flags same-device cross-account referral attempts and masks the associated email', async () => {
    const deviceToken = 'device-shared-fraud-1';
    const acctA = await registerUser({ deviceToken });
    const acctB = await registerUser({ deviceToken });

    const res = await request(app)
      .post('/api/referrals/attribute')
      .set('Authorization', `Bearer ${acctB.token}`)
      .send({ referralCode: acctA.user.referralCode, deviceToken });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SELF_REFERRAL_DETECTED');
    expect(res.body.maskedEmail).toBeDefined();
    expect(res.body.maskedEmail).not.toContain(acctA.user.email.split('@')[0]); // full local part never exposed
  });
});
