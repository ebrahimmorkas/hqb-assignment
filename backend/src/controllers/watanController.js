const watanService = require('../services/watanService');
const logger = require('../utils/logger');
const normalizeError = require('../utils/normalizeError');

const getAllWatans = async (req, res) => {
  try {
    const watans = await watanService.getAllWatans();
    res.status(200).json({ success: true, data: watans });
  } catch (err) {
    logger.logException('getAllWatans failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

module.exports = { getAllWatans };
