const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./env');

const isProd = config.env === 'production';

const logsDir = path.join(__dirname, '../../logs');
if (isProd && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Pretty, colorized output in dev; newline-delimited JSON to a file in prod
// so it can be shipped to a log aggregator later without changing app code.
const destination = isProd
  ? pino.destination({ dest: path.join(logsDir, 'app.log'), sync: false })
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

const logger = pino(
  {
    level: config.log.level,
    base: null,
  },
  destination
);

module.exports = logger;
