// Auth controller: verifies credentials and issues JWT access tokens.
import pool from '../db/connection.db.js';
import config from '../config.js';
import { createAccessToken, hashPassword, verifyPassword } from '../security/auth.security.js';

function createHttpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

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

    const { rows } = await pool.query(
      `SELECT id, name, email, username, role, is_active, password_hash
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (!rows.length) {
      throw createHttpError('Invalid username or password', 401);
    }

    const user = rows[0];
    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      throw createHttpError('Invalid username or password', 401);
    }

    if (!user.is_active) {
      throw createHttpError('User account is inactive', 403);
    }

    const token = createAccessToken(user);

    res.cookie(config.jwtCookieName, token, getAuthCookieOptions());

    res.json({
      data: {
        authenticated: true,
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
    const updates = {};
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    const { rows: currentUserRows } = await pool.query(
      'SELECT id, name, username, is_active, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!currentUserRows.length) {
      const err = new Error('Authenticated user not found');
      err.statusCode = 401;
      throw err;
    }

    const currentUser = currentUserRows[0];

    // Validate and prepare name update
    if (name !== undefined) {
      updates.name = name;
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    // Validate and prepare username update with uniqueness check
    if (username !== undefined) {
      const { rows: usernameCheckRows } = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );
      if (usernameCheckRows.length) {
        const err = new Error('Username already taken');
        err.statusCode = 409;
        throw err;
      }
      updates.username = username;
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    // Validate and prepare password update with current password verification
    if (newPassword !== undefined) {
      const currentPasswordOk = await verifyPassword(oldPassword, currentUser.password_hash);
      if (!currentPasswordOk) {
        const err = new Error('Current password is incorrect');
        err.statusCode = 401;
        throw err;
      }
      const passwordHash = await hashPassword(newPassword);
      updates.password_hash = passwordHash;
      updateFields.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
      paramCount++;
    }

    // Validate isActive change
    if (isActive !== undefined) {
      // Check if user is trying to reactivate (set to true) while currently inactive
      if (isActive === true && currentUser.is_active === false) {
        const err = new Error('User account reactivation can only be done by an admin');
        err.statusCode = 403;
        throw err;
      }
      updates.is_active = isActive;
      updateFields.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    // If no updates provided
    if (updateFields.length === 0) {
      res.json({ message: 'No profile updates provided' });
      return;
    }

    // Execute update
    updateFields.push(`updated_at = NOW()`);
    values.push(req.user.id);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    // Fetch and return updated user
    const { rows: updatedUserRows } = await pool.query(
      'SELECT id, name, email, username, role, is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    const updatedUser = updatedUserRows[0];
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
