require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

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
};

module.exports = config;
