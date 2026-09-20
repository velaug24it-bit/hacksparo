/**
 * Centralized Error Handler Middleware
 * Catches all runtime errors and returns sanitized, user-friendly responses.
 */

const errorHandler = (err, req, res, next) => {
  // Log error details on server side for observability
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  let userMessage = err.message || 'An unexpected error occurred while processing the resource request.';

  // MongoDB duplicate key error handling
  if (err.code === 11000) {
    userMessage = 'A resource request with this identifier already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    errorType: err.name || 'ApplicationError'
    // Stack trace deliberately omitted in production/client response
  });
};

module.exports = errorHandler;
