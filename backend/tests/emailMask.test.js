const { maskEmail } = require('../src/utils/emailMask');

describe('maskEmail', () => {
  it('masks a normal-length local part showing first 4 and last 3 chars', () => {
    expect(maskEmail('ayanalam@example.com')).toBe('ayan***lam@example.com');
  });

  it('masks a short local part conservatively', () => {
    expect(maskEmail('abc@gmail.com')).toBe('ab***@gmail.com');
  });

  it('preserves the domain exactly', () => {
    expect(maskEmail('someone@my-domain.co.uk')).toMatch(/@my-domain\.co\.uk$/);
  });

  it('throws on invalid input', () => {
    expect(() => maskEmail('not-an-email')).toThrow();
  });
});
