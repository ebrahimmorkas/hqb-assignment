// Central registry of cache key builders - keeps naming consistent and makes
// every cacheable key discoverable from one place instead of hardcoded strings
// scattered across services.
const redisKeys = {
  userById: (id) => `user:${id}`,
  userList: () => `users:all`,
  watanList: () => `watans:all`,
};

module.exports = redisKeys;
