const userService = require('../services/userService');
const logger = require('../utils/logger');
const normalizeError = require('../utils/normalizeError');
const { ROLES } = require('../constants/roles');
const { canManage } = require('../utils/userPermissions');

// Convention: every controller function has its own try/catch. On error we
// log via logger.logException, normalize it to an HTTP status via
// normalizeError, and send an error response - the frontend uses the
// status to decide whether to show it inline (400) or redirect to a
// dedicated error page (403/500).

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
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    // Same row-visibility rule as the listing - 404 rather than 403 so a
    // row outside what this actor can manage doesn't even confirm it exists.
    if (!user || !canManage(req.user.role, user)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const visibleUser = req.user.role === ROLES.ADMIN ? stripWatan(user) : user;

    res.status(200).json({ success: true, data: visibleUser });
  } catch (err) {
    logger.logException('getUserById failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const getUserByIts = async (req, res) => {
  try {
    const user = await userService.getUserByIts(req.params.its);

    if (!user || !canManage(req.user.role, user)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const visibleUser = req.user.role === ROLES.ADMIN ? stripWatan(user) : user;

    res.status(200).json({ success: true, data: visibleUser });
  } catch (err) {
    logger.logException('getUserByIts failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    logger.logException('createUser failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
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
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
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
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const markInactive = handleStatusChange(userService.markUserInactive, 'markInactive failed');
const markActive = handleStatusChange(userService.markUserActive, 'markActive failed');
const deleteUser = handleStatusChange(userService.deleteUser, 'deleteUser failed');

module.exports = {
  getAllUsers,
  getUserById,
  getUserByIts,
  createUser,
  updateUser,
  markInactive,
  markActive,
  deleteUser,
};
