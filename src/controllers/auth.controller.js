import config from '../config.js';
import { createAccessToken, hashPassword, verifyPassword } from '../security/auth.security.js';
import { createError } from '../utils/error.utils.js';
import { getUserByUsername, checkUsernameUnique, getUserById } from '../utils/user.queries.js';
import { executeUpdate } from '../utils/db.queries.js';

function getAuthCookieOptions() {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
  };

  if (config.cookieDomain) {
    cookieOptions.domain = config.cookieDomain;
  }

  return cookieOptions;
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const user = await getUserByUsername(username);
    if (!user) {
      throw createError('Invalid username or password', 401);
    }

    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      throw createError('Invalid username or password', 401);
    }

    const token = createAccessToken(user);
    res.cookie(config.jwtCookieName, token, getAuthCookieOptions());

    res.json({
      data: {
        authenticated: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.is_active,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function currentUser(req, res) {
  res.json({ data: req.user });
}

export async function logout(req, res) {
  res.clearCookie(config.jwtCookieName, getAuthCookieOptions());
  res.json({ message: 'Logged out successfully' });
}

export async function updateOwnProfile(req, res, next) {
  try {
    const { name, username, newPassword, oldPassword, isActive } = req.body;
    const currentUser = await getUserById(req.user.id, 'id, name, username, is_active, password_hash');

    if (!currentUser) {
      throw createError('Authenticated user not found', 401);
    }

    const updateFields = {};

    // Validate and prepare name update
    if (name !== undefined) {
      updateFields.name = name;
    }

    // Validate and prepare username update with uniqueness check
    if (username !== undefined) {
      const isUnique = await checkUsernameUnique(username, req.user.id);
      if (!isUnique) {
        throw createError('Username already taken', 409);
      }
      updateFields.username = username;
    }

    // Validate and prepare password update with current password verification
    if (newPassword !== undefined) {
      if (!oldPassword) {
        throw createError('Current password is required to change password', 400);
      }
      const currentPasswordOk = await verifyPassword(oldPassword, currentUser.password_hash);
      if (!currentPasswordOk) {
        throw createError('Current password is incorrect', 401);
      }
      const passwordHash = await hashPassword(newPassword);
      updateFields.password_hash = passwordHash;
    }

    // Validate isActive change
    if (isActive !== undefined) {
      // Reactivation (set to true) is admin-only operation
      if (isActive === true && currentUser.is_active === false) {
        throw createError('User account reactivation can only be done by an admin', 403);
      }
      // Admin cannot deactivate their own account
      if (isActive === false && req.user.role === 'admin') {
        throw createError('Admin cannot deactivate their own account', 403);
      }
      // Viewers and analysts can deactivate themselves
      updateFields.is_active = isActive;
    }

    // If no updates provided
    if (Object.keys(updateFields).length === 0) {
      res.json({ message: 'No profile updates provided' });
      return;
    }

    updateFields.updated_at = new Date().toISOString();
    const updatedUser = await executeUpdate(updateFields, req.user.id, 'users');

    if (!updatedUser) {
      throw createError('Failed to update profile', 500);
    }

    res.json({
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
}
