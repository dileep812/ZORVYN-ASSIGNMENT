function createHttpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createHttpError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(createHttpError(`This action requires one of: ${roles.join(', ')}`, 403));
    }

    next();
  };
}
