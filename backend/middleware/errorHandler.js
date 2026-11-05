const { ApiError } = require('../utils/apiResponse');

/**
 * Catches errors thrown (or passed via next(err)) from any route and
 * converts them into the standard API error envelope.
 * Must be registered LAST, after all routes, in server.js.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  // MySQL duplicate entry, etc.
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with this value already exists.', code: 'DUPLICATE_ENTRY' },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * 404 handler for any route that doesn't match. Registered right before
 * errorHandler so unmatched routes still get the standard JSON shape.
 */
function notFound(req, res, next) {
  next(new (require('../utils/apiResponse').ApiError)(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  ));
}

module.exports = { errorHandler, notFound };
