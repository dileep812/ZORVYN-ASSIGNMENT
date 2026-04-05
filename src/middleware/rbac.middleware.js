import { createError } from '../utils/error.utils.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(`This action requires one of: ${roles.join(', ')}`, 403));
    }

    next();
  };
}
