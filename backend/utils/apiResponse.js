/**
 * Standard response envelope used across every API endpoint so the
 * frontend can rely on one consistent shape.
 *
 * Success: { success: true, data, message }
 * Error:   { success: false, error: { message, code } }
 */

function success(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function error(res, message = 'Something went wrong', statusCode = 500, code = 'INTERNAL_ERROR') {
  return res.status(statusCode).json({ success: false, error: { message, code } });
}

/**
 * A typed error you can `throw` from anywhere in a controller/service.
 * The global error handler middleware will turn this into a proper
 * HTTP response automatically.
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = { success, error, ApiError };
