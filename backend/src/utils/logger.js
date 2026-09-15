const pino = require('./../config/loggerConfig');

// Central logging interface - every layer (config, services, controllers)
// should log through this, never call console.* or pino directly. Keeping
// one wrapper means the underlying logger (currently pino) can be swapped
// without touching call sites.

function logInfo(success, failure, message, meta = {}) {
  if (failure) {
    pino.warn(meta, message);
    return;
  }
  pino.info(meta, message);
}

function logWarn(message, meta = {}) {
  pino.warn(meta, message);
}

function logDebug(message, meta = {}) {
  pino.debug(meta, message);
}

function logException(message, data = {}) {
  if (data instanceof Error) {
    pino.error(
      { error: { message: data.message, stack: data.stack, name: data.name } },
      message
    );
    return;
  }

  const err = data.err || data.error;
  if (err instanceof Error) {
    pino.error(
      { ...data, error: { message: err.message, stack: err.stack, name: err.name } },
      message
    );
    return;
  }

  pino.error(data, message);
}

module.exports = {
  logInfo,
  logWarn,
  logDebug,
  logException,
};
