const userService = require('../services/userService');
const logger = require('../utils/logger');
const { ROLES } = require('../constants/roles');

// Convention: every controller function has its own try/catch. On error we
// log via logger.logException and send an error response - the frontend
// uses that response to redirect the user to the error page. No caching or
// DB logic lives here, that's the service layer's job.

// Row visibility by requester role: admin manages plain users only; a
// super-admin manages users and admins, but never another super-admin
// (including themselves - this table is for managing others, not self).
const ROW_VISIBILITY = {
  [ROLES.ADMIN]: (row) => row.role === ROLES.USER,
  [ROLES.SUPER_ADMIN]: (row) => row.role !== ROLES.SUPER_ADMIN,
};

const stripWatan = ({ watan, ...rest }) => rest;

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    // The underlying list is cached in full (role-agnostic) by the service -
    // filtering by the requester's role happens here, per-request, since it
    // depends on req.user, not on the stored data itself.
    const visibleUsers = users
      .filter(ROW_VISIBILITY[req.user.role])
      .map((user) => (req.user.role === ROLES.ADMIN ? stripWatan(user) : user));

    res.status(200).json({ success: true, data: visibleUsers });
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
