export function createError(message, statusCode = 500, details = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (details) {
    err.details = details;
  }
  return err;
}
