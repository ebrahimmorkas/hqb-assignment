const WatanMaster = require('../models/WatanMaster');
const redisService = require('./redisService');
const redisKeys = require('../utils/redisKeys');
const logger = require('../utils/logger');

async function getAllWatans() {
  try {
    const watans = await redisService.getOrSet(redisKeys.watanList(), () =>
      WatanMaster.find().sort({ name: 1 }).lean()
    );

    logger.logInfo(1, 0, 'Fetched all watans', { count: watans.length });

    return watans;
  } catch (err) {
    throw err;
  }
}

module.exports = { getAllWatans };
