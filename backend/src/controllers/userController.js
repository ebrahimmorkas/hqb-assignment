const userService = require('../services/userService');
const logger = require('../utils/logger');
const { ROLES } = require('../constants/roles');
const { canManage } = require('../utils/userPermissions');

// Convention: every controller function has its own try/catch. On error we
// log via logger.logException and send an error response - the frontend
// uses that response to redirect the user to the error page. No caching or
// DB logic lives here, that's the service layer's job.

const stripWatan = ({ watan, ...rest }) => rest;

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    // The underlying list is cached in full (role-agnostic) by the service -
    // filtering by the requester's role happens here, per-request, since it
    // depends on req.user, not on the stored data itself.
    const visibleUsers = users
      .filter((row) => canManage(req.user.role, row))
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
    const user = await userService.updateUser(req.params.id, req.body, req.user);

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

// Shared by the three status-transition endpoints below - only the service
// method differs, the request/response shape is identical.
const handleStatusChange = (serviceMethod, failLabel) => async (req, res) => {
  try {
    const user = await serviceMethod(req.params.id, req.user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    logger.logException(failLabel, err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

const markInactive = handleStatusChange(userService.markUserInactive, 'markInactive failed');
const markActive = handleStatusChange(userService.markUserActive, 'markActive failed');
const deleteUser = handleStatusChange(userService.deleteUser, 'deleteUser failed');

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  markInactive,
  markActive,
  deleteUser,
};
