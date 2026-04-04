function createValidationError(message, details) {
  const err = new Error(message);
  err.statusCode = 400;
  err.details = details;
  return err;
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema(req.body);
    if (!result.success) {
      const details = result.issues.map((issue) => ({
        field: issue.field,
        message: issue.message,
      }));
      return next(createValidationError('Invalid request body', details));
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
      return next(createValidationError('Invalid query parameters', details));
    }
    req.query = result.data;
    next();
  };
}
