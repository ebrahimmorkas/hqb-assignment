const { createClient } = require('redis');
const config = require('./env');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  if (!config.redis.enabled) {
    logger.logInfo(1, 0, 'Redis is disabled via config (IS_REDIS_SERVER_ON) - skipping connection');
    return null;
  }

  try {
    if (client && client.isOpen) return client;

    client = createClient({
      url: config.redis.url,
      password: config.redis.password,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.logInfo(0, 1, 'Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 2000);
        },
        connectTimeout: 10000,
      },
    });

    client.on('error', (err) => {
      logger.logInfo(0, 1, 'Redis client error', { err });
    });

    client.on('ready', () => {
      logger.logInfo(1, 0, 'Redis connected');
    });

    client.on('reconnecting', () => {
      logger.logInfo(0, 1, 'Redis reconnecting');
    });

    client.on('end', () => {
      logger.logInfo(1, 0, 'Redis connection closed');
    });

    await client.connect();

    return client;
  } catch (err) {
    logger.logException('Redis connection failed', { err });
    return null;
  }
};

const getRedisClient = () => {
  if (!client || !client.isOpen) {
    return null;
  }
  return client;
};

const closeRedis = async () => {
  try {
    if (client && client.isOpen) {
      await client.quit();
      client = null;
      logger.logInfo(1, 0, 'Redis connection closed gracefully');
    }
  } catch (err) {
    logger.logException('Error closing Redis', { err });
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
};
