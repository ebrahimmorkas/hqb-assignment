// A thrown error that already knows its HTTP status code, so a controller's
// catch block can respond with `err.statusCode || 500` without having to
// classify the error itself. Services throw this for expected failures
// (bad credentials, not found, etc); anything else (a DB/driver error) just
// falls through as a plain Error and the controller defaults it to 500.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
