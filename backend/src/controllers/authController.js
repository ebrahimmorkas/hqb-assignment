const authService = require('../services/authService');
const userService = require('../services/userService');
const config = require('../config/env');
const logger = require('../utils/logger');
const normalizeError = require('../utils/normalizeError');

// Cookie options are HTTP-specific, so they live here (controller), not in
// the service. The refresh cookie's path is scoped to /api/auth so it is
// never sent on ordinary API requests, only to the endpoints that need it.
const accessCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.accessMaxAgeMs,
  path: '/',
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.refreshMaxAgeMs,
  path: '/api/auth',
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(config.cookie.accessTokenName, accessToken, accessCookieOptions());
  res.cookie(config.cookie.refreshTokenName, refreshToken, refreshCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie(config.cookie.accessTokenName, { ...accessCookieOptions(), maxAge: undefined });
  res.clearCookie(config.cookie.refreshTokenName, { ...refreshCookieOptions(), maxAge: undefined });
};

const login = async (req, res) => {
  try {
    const { its, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(its, password);

    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    logger.logException('login failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.[config.cookie.refreshTokenName];
    const { accessToken, refreshToken } = await authService.refresh(token);

    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (err) {
    logger.logException('refresh failed', err);
    // A failed refresh means the session can't continue - clear whatever
    // cookies exist so the frontend cleanly falls back to the login screen.
    clearAuthCookies(res);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.user?.id);
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    logger.logException('logout failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

const me = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    logger.logException('me failed', err);
    const { statusCode, message } = normalizeError(err);
    res.status(statusCode).json({ success: false, message });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  me,
};
