const User = require('../models/User');
const redisService = require('./redisService');
const redisKeys = require('../utils/redisKeys');
const logger = require('../utils/logger');

// Controllers only ever call these methods - caching is an implementation
// detail of the service layer. Whether Redis is on or off, callers get back
// the same data shape from the same DB-backed source of truth.
//
// Convention: every function is wrapped in try/catch. The catch block only
// rethrows - services don't decide how to respond to an error, controllers
// do. Logging of the error itself also happens at the controller layer.

async function getAllUsers() {
  try {
    const users = await redisService.getOrSet(redisKeys.userList(), () =>
      User.find().select('-password').lean()
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
    const user = await User.create(data);

    // Invalidate the list cache so the new user shows up on next read.
    await redisService.del(redisKeys.userList());

    // toObject() on a freshly-created document includes every field
    // regardless of schema-level select:false (that flag only prunes fields
    // on a *queried* document, not one already in hand) - strip manually.
    const { password, tokenVersion, ...safeUser } = user.toObject();

    logger.logInfo(1, 0, 'User created', { id: safeUser._id, email: safeUser.email });

    return safeUser;
  } catch (err) {
    throw err;
  }
}

async function updateUser(id, data) {
  try {
    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .lean();

    if (user) {
      await Promise.all([
        redisService.del(redisKeys.userById(id)),
        redisService.del(redisKeys.userList()),
      ]);
    }

    logger.logInfo(!!user, !user, 'User update', { id, found: !!user });

    return user;
  } catch (err) {
    throw err;
  }
}

async function deleteUser(id) {
  try {
    const user = await User.findByIdAndDelete(id).select('-password').lean();

    if (user) {
      await Promise.all([
        redisService.del(redisKeys.userById(id)),
        redisService.del(redisKeys.userList()),
      ]);
    }

    logger.logInfo(!!user, !user, 'User delete', { id, found: !!user });

    return user;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
