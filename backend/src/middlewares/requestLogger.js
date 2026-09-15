const logger = require('../utils/logger');

// Logs every incoming request once it finishes, with method/path/status/
// duration. Mount this before the routes so it wraps every action.
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const isError = res.statusCode >= 500;

    logger.logInfo(!isError, isError, `${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};
