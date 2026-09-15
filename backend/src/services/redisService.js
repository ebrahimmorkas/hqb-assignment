const { getRedisClient } = require('../config/redisConfig');
const config = require('../config/env');
const logger = require('../utils/logger');

// Every method below is gated by isRedisEnabled(). When Redis is turned off
// (IS_REDIS_SERVER_ON != 1) get/set/del all become no-ops, so getOrSet()
// always falls through to the caller's fetchFunction - i.e. the DB. This is
// the single place that decides "is caching on right now" for the whole app.
class RedisService {
  isRedisEnabled() {
    return config.redis.enabled === true;
  }

  getClient() {
    const client = getRedisClient();

    if (!client) {
      logger.logInfo(0, 1, 'Redis not available');
      return null;
    }

    return client;
  }

  validateKey(key) {
    if (!key || typeof key !== 'string') {
      logger.logInfo(0, 1, 'Invalid redis key', { key });
    }
  }

  safeParse(data, key) {
    try {
      return JSON.parse(data);
    } catch (err) {
      logger.logException('Invalid JSON in Redis', { key, data });
      return null;
    }
  }

  async get(key) {
    try {
      this.validateKey(key);

      if (!this.isRedisEnabled()) return null;

      const client = this.getClient();
      if (!client) return null;

      const data = await client.get(key);

      if (data === null) {
        logger.logInfo(0, 1, 'Cache MISS', { key });
        return null;
      }

      logger.logInfo(1, 0, 'Cache HIT', { key });

      return this.safeParse(data, key);
    } catch (err) {
      logger.logException('Redis GET error', { key, err });
      return null;
    }
  }

  async set(key, value, ttl = config.redis.defaultTTL) {
    try {
      this.validateKey(key);

      if (!this.isRedisEnabled()) return false;

      const client = this.getClient();
      if (!client) return false;

      if (ttl <= 0) ttl = config.redis.defaultTTL;

      await client.setEx(key, ttl, JSON.stringify(value));

      logger.logInfo(1, 0, 'Cache SET', { key, ttl });

      return true;
    } catch (err) {
      logger.logException('Redis SET error', { key, err });
      return false;
    }
  }

  async del(key) {
    try {
      this.validateKey(key);

      if (!this.isRedisEnabled()) return false;

      const client = this.getClient();
      if (!client) return false;

      await client.del(key);

      logger.logInfo(1, 0, 'Cache DEL', { key });

      return true;
    } catch (err) {
      logger.logException('Redis DEL error', { key, err });
      return false;
    }
  }

  // Cache-aside helper: try cache, and on miss (or when Redis is disabled)
  // run fetchFunction (the DB call) and populate the cache for next time.
  async getOrSet(key, fetchFunction, ttl = config.redis.defaultTTL) {
    try {
      this.validateKey(key);

      const cached = await this.get(key);

      if (cached !== null) return cached;

      logger.logInfo(0, 1, 'Cache MISS - fetching from source', { key });

      const freshData = await fetchFunction();

      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, ttl);
      }

      return freshData;
    } catch (err) {
      logger.logException('Redis getOrSet error', { key, err });

      // Even if the cache layer itself throws unexpectedly, the request
      // should still succeed by falling back to the source of truth.
      return fetchFunction();
    }
  }
}

module.exports = new RedisService();
