const User = require('../models/User');
const redisService = require('./redisService');
const redisKeys = require('../utils/redisKeys');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { canManage, canEdit, editableFieldsFor } = require('../utils/userPermissions');
const { ROLES } = require('../constants/roles');
const { STATUS } = require('../constants/status');

// Controllers only ever call these methods - caching is an implementation
// detail of the service layer. Whether Redis is on or off, callers get back
// the same data shape from the same DB-backed source of truth.
//
// Convention: every function is wrapped in try/catch. The catch block only
// rethrows - services don't decide how to respond to an error, controllers
// do. Logging of the error itself also happens at the controller layer.

async function getAllUsers() {
  try {
    // Deleted (status D) is permanent-from-the-UI's-perspective: excluded at
    // the query itself, not just filtered client-side, and cached that way.
    const users = await redisService.getOrSet(redisKeys.userList(), () =>
      User.find({ status: { $ne: STATUS.DELETED } })
        .select('-password')
        .lean()
    );

    logger.logInfo(1, 0, 'Fetched all users', { count: users.length });

    return users;
  } catch (err) {
    throw err;
  }
}

async function getUserById(id) {
  try {
    const user = await redisService.getOrSet(redisKeys.userById(id), () =>
      User.findById(id).select('-password').lean()
    );

    logger.logInfo(!!user, !user, 'Fetched user by id', { id, found: !!user });

    return user;
  } catch (err) {
    throw err;
  }
}

async function createUser(data) {
  try {
    // Only super-admin can even reach this (route-gated), but don't trust
    // that alone - block spawning another super-admin through this form
    // regardless of who's calling it.
    if (data.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(400, 'Cannot create a super-admin user');
    }

    const user = await User.create(data);

    // Invalidate the list cache so the new user shows up on next read.
    await redisService.del(redisKeys.userList());

    // toObject() on a freshly-created document includes every field
    // regardless of schema-level select:false (that flag only prunes fields
    // on a *queried* document, not one already in hand) - strip manually.
    const { password, tokenVersion, statusAudit, ...safeUser } = user.toObject();

    logger.logInfo(1, 0, 'User created', { id: safeUser._id, email: safeUser.email });

    return safeUser;
  } catch (err) {
    throw err;
  }
}

async function updateUser(id, data, actor) {
  try {
    const existing = await User.findById(id);

    if (!existing) return null;

    if (!canEdit(actor.role, actor.id, existing)) {
      throw new ApiError(403, 'Forbidden');
    }

    // Edit is only offered in the UI while a row is Active - enforced here
    // too, so a direct API call can't bypass that.
    if (existing.status !== STATUS.ACTIVE) {
      throw new ApiError(400, 'Only active users can be edited');
    }

    // Silently drop anything outside the actor's allowed field set, rather
    // than erroring - an admin's edit request may legitimately still carry
    // its/watan in the payload (unchanged, from the form's initial values)
    // even though they're not allowed to be the one to change them.
    const allowedFields = editableFieldsFor(actor.role);
    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    const user = await User.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .lean();

    await Promise.all([
      redisService.del(redisKeys.userById(id)),
      redisService.del(redisKeys.userList()),
    ]);

    logger.logInfo(1, 0, 'User update', { id });

    return user;
  } catch (err) {
    throw err;
  }
}

// One rule per target status: who may set it, what the row must currently
// be, and which rows they're allowed to touch at all (canManage - the same
// rule the users-list row filter uses).
const TRANSITIONS = {
  [STATUS.INACTIVE]: {
    actionName: 'markUserInactive',
    allowedActorRoles: [ROLES.ADMIN],
    requiredCurrentStatus: STATUS.ACTIVE,
  },
  [STATUS.ACTIVE]: {
    actionName: 'markUserActive',
    allowedActorRoles: [ROLES.SUPER_ADMIN],
    requiredCurrentStatus: STATUS.INACTIVE,
  },
  [STATUS.DELETED]: {
    actionName: 'deleteUser',
    allowedActorRoles: [ROLES.SUPER_ADMIN],
    requiredCurrentStatus: STATUS.INACTIVE,
  },
};

async function changeUserStatus(id, targetStatus, actor) {
  try {
    const rule = TRANSITIONS[targetStatus];

    if (!rule.allowedActorRoles.includes(actor.role)) {
      throw new ApiError(403, 'Forbidden');
    }

    const user = await User.findById(id).select('+statusAudit');

    if (!user) return null;

    if (!canManage(actor.role, user)) {
      throw new ApiError(403, 'Forbidden');
    }

    if (user.status !== rule.requiredCurrentStatus) {
      throw new ApiError(
        400,
        `User must have status "${rule.requiredCurrentStatus}" for this action`
      );
    }

    user.status = targetStatus;
    user.statusAudit.push({ status: targetStatus, changedBy: actor.id, changedAt: new Date() });
    await user.save();

    await Promise.all([
      redisService.del(redisKeys.userById(id)),
      redisService.del(redisKeys.userList()),
    ]);

    logger.logInfo(1, 0, rule.actionName, { id, targetStatus, changedBy: actor.id });

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.tokenVersion;
    delete safeUser.statusAudit;

    return safeUser;
  } catch (err) {
    throw err;
  }
}

const markUserInactive = (id, actor) => changeUserStatus(id, STATUS.INACTIVE, actor);
const markUserActive = (id, actor) => changeUserStatus(id, STATUS.ACTIVE, actor);
const deleteUser = (id, actor) => changeUserStatus(id, STATUS.DELETED, actor);

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  markUserInactive,
  markUserActive,
  deleteUser,
};
