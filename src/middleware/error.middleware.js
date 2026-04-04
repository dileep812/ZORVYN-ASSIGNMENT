export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle custom application errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle database errors
  else if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry or constraint violation';
  }
  else if (err.code === '23503') {
    statusCode = 409;
    message = 'Referenced record does not exist';
  }
  else if (err.code === '42P01') {
    statusCode = 500;
    message = 'Database table not found';
  }
  // Handle other common errors
  else if (err.message === 'Unauthorized' || err.message?.includes('unauthorized')) {
    statusCode = 401;
    message = 'Authentication required';
  }

  const payload = { message };
  if (details) {
    payload.details = details;
  }

  if (statusCode >= 500) {
    console.error('Server error:', err);
  } else {
    console.warn(`${statusCode} ${message}`);
  }

  res.status(statusCode).json(payload);
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found' });
}
