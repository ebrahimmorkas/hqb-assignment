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

async function getUserByIts(its) {
  try {
    // Excludes deleted users, same reasoning as auth login: ITS is only
    // unique among non-deleted users, so a deleted account's ITS may have
    // since been reissued to a brand new one - this must resolve to the
    // live account, not a historical deleted one. Not cached (unlike
    // getUserById) - this is a low-traffic lookup, not worth the extra
    // cache-invalidation bookkeeping on every status/edit call.
    const user = await User.findOne({ its, status: { $ne: STATUS.DELETED } })
      .select('-password')
      .lean();

    logger.logInfo(!!user, !user, 'Fetched user by ITS', { its, found: !!user });

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

const STATUS_LABELS = {
  [STATUS.ACTIVE]: 'Active',
  [STATUS.INACTIVE]: 'Inactive',
  [STATUS.DELETED]: 'Deleted',
};

// One rule per target status: who may set it (given who the actor is AND
// what role the target row has), what the row must currently be, which rows
// they're allowed to touch at all (canManage - the same rule the users-list
// row filter uses), and a human-readable message for when the current
// status doesn't allow it - naming what's actually wrong (e.g. "already
// Active") rather than a generic "must have status I" that means nothing to
// whoever's reading it.
const TRANSITIONS = {
  [STATUS.INACTIVE]: {
    actionName: 'markUserInactive',
    // Admin deactivates a plain user (the normal case). A regular admin can
    // never manage another admin's row at all (canManage blocks it
    // entirely), so without this, an admin-role account could never be
    // deactivated by anyone - super-admin bypasses the normal rule
    // specifically for admin-role targets to close that gap.
    isActorAllowed: (actorRole, targetRole) =>
      (actorRole === ROLES.ADMIN && targetRole === ROLES.USER) ||
      (actorRole === ROLES.SUPER_ADMIN && targetRole === ROLES.ADMIN),
    requiredCurrentStatus: STATUS.ACTIVE,
    wrongStatusMessage: (currentStatus) =>
      currentStatus === STATUS.INACTIVE
        ? "Can't mark Inactive as user is already Inactive"
        : `Can't mark Inactive as user is ${STATUS_LABELS[currentStatus]}`,
  },
  [STATUS.ACTIVE]: {
    actionName: 'markUserActive',
    isActorAllowed: (actorRole) => actorRole === ROLES.SUPER_ADMIN,
    requiredCurrentStatus: STATUS.INACTIVE,
    wrongStatusMessage: (currentStatus) =>
      currentStatus === STATUS.ACTIVE
        ? "Can't mark Active as user is already Active"
        : `Can't mark Active as user is ${STATUS_LABELS[currentStatus]}`,
  },
  [STATUS.DELETED]: {
    actionName: 'deleteUser',
    isActorAllowed: (actorRole) => actorRole === ROLES.SUPER_ADMIN,
    requiredCurrentStatus: STATUS.INACTIVE,
    wrongStatusMessage: (currentStatus) =>
      currentStatus === STATUS.ACTIVE
        ? "Can't delete user as they are still Active - Ask admin to mark them Inactive first"
        : `Can't delete user as they are ${STATUS_LABELS[currentStatus]}`,
  },
};

async function changeUserStatus(id, targetStatus, actor) {
  try {
    const rule = TRANSITIONS[targetStatus];

    const user = await User.findById(id).select('+statusAudit');

    if (!user) return null;

    if (!canManage(actor.role, user)) {
      throw new ApiError(403, 'Forbidden');
    }

    if (!rule.isActorAllowed(actor.role, user.role)) {
      throw new ApiError(403, 'Forbidden');
    }

    if (user.status !== rule.requiredCurrentStatus) {
      throw new ApiError(400, rule.wrongStatusMessage(user.status));
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
  getUserByIts,
  createUser,
  updateUser,
  markUserInactive,
  markUserActive,
  deleteUser,
};
