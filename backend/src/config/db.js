const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.logInfo(1, 0, 'MongoDB connected');
  } catch (err) {
    logger.logException('MongoDB connection failed', { err });
    process.exit(1);
  }
};

module.exports = connectDB;
