import { createError } from '../utils/error.utils.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema(req.body);
    if (!result.success) {
      const details = result.issues.map((issue) => ({
        field: issue.field,
        message: issue.message,
      }));
      return next(createError('Invalid request body', 400, details));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema(req.query);
    if (!result.success) {
      const details = result.issues.map((issue) => ({
        field: issue.field,
        message: issue.message,
      }));
      return next(createError('Invalid query parameters', 400, details));
    }
    req.validatedQuery = result.data;
    next();
  };
}
