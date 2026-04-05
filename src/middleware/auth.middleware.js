// Authentication middleware: validates Bearer JWT and loads active user context.
import pool from '../db/connection.db.js';
import config from '../config.js';
import { verifyAccessToken } from '../security/auth.security.js';
import { createError } from '../utils/error.utils.js';

export async function isToken(req, res, next) {
  try {
    let token = req.cookies?.[config.jwtCookieName];
    if (!token) {
      const authorization = req.header('authorization');
      if (authorization) {
        const [scheme, bearerToken] = authorization.split(' ');
        if (scheme === 'Bearer' && bearerToken) {
          token = bearerToken;
        }
      }
    }

    if (!token) {
      throw createError('Authentication token missing', 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw createError('Invalid or expired token', 401);
    }

    const userIdNum = Number(payload.sub);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      throw createError('Invalid token subject', 401);
    }

    const { rows } = await pool.query(
      'SELECT id, name, email, username, role, is_active FROM users WHERE id = $1',
      [userIdNum]
    );

    if (!rows.length) {
      throw createError('Authenticated user not found', 401);
    }

    const user = rows[0];
    if (!user.is_active) {
      throw createError('User account is inactive', 403);
    }

    req.user = user;
    req.userRole = user.role;
    res.locals.userRole = user.role;
    res.setHeader('x-user-role', user.role);
    next();
  } catch (error) {
    next(error);
  }
}
