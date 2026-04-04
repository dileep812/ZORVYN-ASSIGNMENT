// Auth controller: verifies credentials and issues JWT access tokens.
import pool from '../db/connection.db.js';
import config from '../config.js';
import { createAccessToken, hashPassword, verifyPassword } from '../security/auth.security.js';

function createHttpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
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

    res.json({
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: config.jwtExpiresIn,
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

export async function changeOwnPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!rows.length) {
      const err = new Error('Authenticated user not found');
      err.statusCode = 401;
      throw err;
    }

    const user = rows[0];
    const currentOk = await verifyPassword(currentPassword, user.password_hash);
    if (!currentOk) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 401;
      throw err;
    }

    const newPasswordHash = await hashPassword(newPassword);
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, req.user.id]
    );

    res.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
