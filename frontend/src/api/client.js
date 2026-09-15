/**
 * Shared fetch-based API client.
 *
 * Auth is entirely cookie-based (httpOnly access + refresh tokens set by the
 * backend) - the frontend never reads or stores a token itself, it just
 * sends credentials: 'include' on every request and lets the browser attach
 * the cookies. On a 401 (access token expired) it transparently calls
 * /auth/refresh once and retries the original request before giving up.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Calling /auth/refresh itself (or logging in/out) must never trigger another
// refresh attempt on its own 401 - that would loop forever.
const REFRESH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Dedupe concurrent refresh attempts: several requests can 401 at once, but
// only one refresh call should go out - every caller awaits the same promise.
let refreshPromise = null;

const performRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Notified when a refresh attempt fails, i.e. the session is truly over.
// AuthContext subscribes to this to clear its user state and redirect.
let sessionExpiredHandler = null;
export const onSessionExpired = (handler) => {
  sessionExpiredHandler = handler;
};

/**
 * @param {string} path - relative to the API base URL, e.g. '/auth/me'
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object} [options.body] - JSON-serialized automatically
 */
export async function apiRequest(path, { method = 'GET', body, _isRetry = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection.', 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response body; fall through with payload = null
  }

  const isExempt = REFRESH_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));

  if (response.status === 401 && !_isRetry && !isExempt) {
    const refreshed = await performRefresh();
    if (refreshed) {
      return apiRequest(path, { method, body, _isRetry: true });
    }
    sessionExpiredHandler?.();
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}`, response.status);
  }

  return payload?.data;
}

export default apiRequest;
