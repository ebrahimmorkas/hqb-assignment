// Maps a caught error to an HTTP status + message. ApiError already carries
// its own statusCode (services throw it deliberately for expected failures)
// and passes through unchanged; anything else is a raw Mongoose/driver
// error that controllers used to just default to 500 - this gives the
// common ones their correct 400 instead.
function normalizeError(err) {
  if (err.statusCode) {
    return { statusCode: err.statusCode, message: err.message };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((fieldErr) => fieldErr.message)
      .join(', ');
    return { statusCode: 400, message };
  }

  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid ${err.path}: ${err.value}` };
  }

  // Mongo duplicate-key error (unique index violation).
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'Field';
    return { statusCode: 400, message: `${field} already exists` };
  }

  return { statusCode: 500, message: err.message || 'Internal server error' };
}

module.exports = normalizeError;
