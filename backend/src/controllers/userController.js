const userService = require('../services/userService');
const logger = require('../utils/logger');

// Convention: every controller function has its own try/catch. On error we
// log via logger.logException and send an error response - the frontend
// uses that response to redirect the user to the error page. No caching or
// DB logic lives here, that's the service layer's job.

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    logger.logException('getAllUsers failed', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    logger.logException('getUserById failed', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    logger.logException('createUser failed', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    logger.logException('updateUser failed', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    logger.logException('deleteUser failed', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
