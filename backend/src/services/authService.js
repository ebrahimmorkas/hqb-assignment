const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { STATUS } = require('../constants/status');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/token');

// Convention: every function is wrapped in try/catch and the catch block
// only rethrows - controllers decide how to respond, and log the error.

async function login(its, password) {
  try {
    if (!its || !password) {
      throw new ApiError(400, 'ITS and password are required');
    }

    // ITS is only unique among non-deleted users (see the model's partial
    // index) - a deleted account's ITS may since have been reissued to a
    // brand new user, so exclude deleted rows here or this could match
    // either document non-deterministically.
    const user = await User.findOne({ its, status: { $ne: STATUS.DELETED } }).select(
      '+password +tokenVersion'
    );

    if (!user) {
      // Deliberately identical to a wrong password below, and identical to
      // "deleted" (findOne above already excludes deleted rows, so a
      // deleted account's ITS lands here too) - a deleted account should be
      // indistinguishable from one that never existed.
      throw new ApiError(401, 'Invalid ITS or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, 'Invalid ITS or password');
    }

    // Checked only *after* the password is confirmed correct, so a wrong
    // password never reveals whether an existing account is inactive.
    if (user.status === STATUS.INACTIVE) {
      throw new ApiError(401, 'Your account is inactive. Please contact an administrator.');
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, tokenVersion: user.tokenVersion });

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.tokenVersion;

    logger.logInfo(1, 0, 'User logged in', { id: user._id, its: user.its });

    return { user: safeUser, accessToken, refreshToken };
  } catch (err) {
    throw err;
  }
}

async function refresh(refreshToken) {
  try {
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token provided');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user || user.tokenVersion !== decoded.tokenVersion || user.status === STATUS.DELETED) {
      throw new ApiError(401, 'Session expired, please log in again');
    }

    // Without this, a user who was already logged in before being marked
    // inactive could just keep refreshing forever - the login block alone
    // wouldn't actually stop them from using the app.
    if (user.status === STATUS.INACTIVE) {
      throw new ApiError(401, 'Your account is inactive. Please contact an administrator.');
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    // Rotated on every refresh - a leaked-but-unused refresh token still
    // stops working the moment the legitimate client refreshes.
    const newRefreshToken = signRefreshToken({ id: user._id, tokenVersion: user.tokenVersion });

    logger.logInfo(1, 0, 'Access token refreshed', { id: user._id });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw err;
  }
}

async function logout(userId) {
  try {
    if (userId) {
      // Bumping tokenVersion invalidates every refresh token issued before
      // this point, on every device - not just the one calling logout.
      await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    }

    logger.logInfo(1, 0, 'User logged out', { id: userId });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  login,
  refresh,
  logout,
};
