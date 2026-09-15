const UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

// Converts a jsonwebtoken-style duration string ('15m', '7d', ...) to
// milliseconds, for use as a cookie maxAge. Kept separate from the JWT
// expiry string itself so both jsonwebtoken and res.cookie() read from the
// same single value in config/env.js instead of two independently-set numbers
// that could drift out of sync.
function parseDurationMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error(`Invalid duration string: ${duration}`);
  }

  const [, amount, unit] = match;
  return Number(amount) * UNITS[unit];
}

module.exports = parseDurationMs;
