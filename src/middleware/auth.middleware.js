// Authentication middleware: validates Bearer JWT and loads active user context.
import pool from '../db/connection.db.js';
import { verifyAccessToken } from '../security/auth.security.js';

function createHttpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.header('authorization');
    if (!authorization) {
      throw createHttpError('Missing Authorization header', 401);
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw createHttpError('Authorization header must be in format: Bearer <token>', 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw createHttpError('Invalid or expired token', 401);
    }

    const userIdNum = Number(payload.sub);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      throw createHttpError('Invalid token subject', 401);
    }

    const { rows } = await pool.query(
      'SELECT id, name, email, username, role, is_active FROM users WHERE id = $1',
      [userIdNum]
    );

    if (!rows.length) {
      throw createHttpError('Authenticated user not found', 401);
    }

    const user = rows[0];
    if (!user.is_active) {
      throw createHttpError('User account is inactive', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
