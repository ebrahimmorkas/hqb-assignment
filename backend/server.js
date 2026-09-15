const app = require('./src/app');
const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const { connectRedis, closeRedis } = require('./src/config/redisConfig');
const logger = require('./src/utils/logger');

async function start() {
  await connectDB();

  // If Redis is disabled via config, connectRedis() is a no-op and returns
  // null - the app runs happily with every cache call falling through to
  // MongoDB. If it's enabled but the server is unreachable, we still don't
  // block startup: redisService treats "no client" the same as "disabled".
  await connectRedis();

  const server = app.listen(config.port, () => {
    logger.logInfo(1, 0, `Server listening on port ${config.port}`, {
      env: config.env,
      redisEnabled: config.redis.enabled,
    });
  });

  const shutdown = async () => {
    logger.logInfo(1, 0, 'Shutting down gracefully');
    await closeRedis();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
