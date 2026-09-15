require('dotenv').config();
const parseDurationMs = require('../utils/parseDuration');

const isProd = process.env.NODE_ENV === 'production';
const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/user_management_system',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  redis: {
    enabled: process.env.IS_REDIS_SERVER_ON === '1',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    defaultTTL: Number(process.env.REDIS_DEFAULT_TTL) || 3600,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry,
    refreshExpiry,
  },

  cookie: {
    accessTokenName: process.env.ACCESS_TOKEN_COOKIE_NAME || 'access_token',
    refreshTokenName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'refresh_token',
    accessMaxAgeMs: parseDurationMs(accessExpiry),
    refreshMaxAgeMs: parseDurationMs(refreshExpiry),
    // 'lax' works for same-site-but-cross-port localhost dev out of the box;
    // a real cross-domain prod deployment (frontend/backend on different
    // domains) needs sameSite: 'none' + secure: true, set via env.
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    // Independent of NODE_ENV on purpose: a first deployment is often
    // reachable only over plain HTTP (IP address, no domain/cert yet) - a
    // Secure cookie is silently dropped by the browser over HTTP, which
    // would make login look like it worked (Set-Cookie sent) while auth
    // quietly breaks on the very next request. Default follows NODE_ENV,
    // but set COOKIE_SECURE=0 explicitly to run production mode over HTTP
    // until SSL is in place, then flip to 1 once it is.
    secure: process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === '1' : isProd,
  },
};

if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment');
}

module.exports = config;
