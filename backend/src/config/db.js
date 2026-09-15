const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.logInfo(1, 0, 'MongoDB connected');

    if (config.env !== 'production') {
      // Keeps indexes (unique/sparse flags etc.) in sync with the current
      // schema automatically in dev, so a changed field never leaves a
      // stale index behind silently. Skipped in prod - index changes there
      // should be reviewed/applied deliberately.
      for (const modelName of mongoose.modelNames()) {
        await mongoose.model(modelName).syncIndexes();
      }
      logger.logInfo(1, 0, 'MongoDB indexes synced');
    }
  } catch (err) {
    logger.logException('MongoDB connection failed', { err });
    process.exit(1);
  }
};

module.exports = connectDB;
