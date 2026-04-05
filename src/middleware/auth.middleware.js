// Authentication middleware: validates Bearer JWT and loads active user context.
import config from '../config.js';
import { verifyAccessToken } from '../security/auth.security.js';
import { createError } from '../utils/error.utils.js';
import { getUserById } from '../utils/user.queries.js';

async function resolveAuthenticatedUser(req, res, next, options = {}) {
  try {
    const { allowInactive = false } = options;

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

    const user = await getUserById(userIdNum);
    if (!user) {
      throw createError('Authenticated user not found', 401);
    }

    if (!allowInactive && !user.is_active) {
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

export async function isToken(req, res, next) {
  return resolveAuthenticatedUser(req, res, next);
}

export async function isTokenAllowInactive(req, res, next) {
  return resolveAuthenticatedUser(req, res, next, { allowInactive: true });
}
