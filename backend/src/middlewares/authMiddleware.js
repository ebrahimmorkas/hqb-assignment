const config = require('../config/env');
const logger = require('../utils/logger');
const { verifyAccessToken } = require('../utils/token');

// Guards a route behind a valid access-token cookie. On success, attaches
// req.user = { id, role } for downstream handlers/authorize() to read.
const protect = (req, res, next) => {
  try {
    const token = req.cookies?.[config.cookie.accessTokenName];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    logger.logException('authMiddleware.protect failed', err);
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
};

// Role gate - use after protect(). e.g. authorize('admin', 'super-admin').
const authorize = (...roles) => (req, res, next) => {
  try {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  } catch (err) {
    logger.logException('authMiddleware.authorize failed', err);
    res.status(403).json({ success: false, message: 'Forbidden' });
  }
};

module.exports = { protect, authorize };
