import pool from '../db/connection.db.js';
import { hashPassword } from '../security/auth.security.js';

async function getExistingAdmin() {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );
  return rows[0] || null;
}

export async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, username, role, is_active, created_at FROM users ORDER BY id'
    );
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, username, password, role, isActive } = req.body;

    if (role === 'admin') {
      const existingAdmin = await getExistingAdmin();
      if (existingAdmin) {
        const err = new Error('Only one admin account is allowed');
        err.statusCode = 409;
        throw err;
      }
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, username, role, is_active, created_at`,
      [name, email, username, passwordHash, role, isActive]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      const err = new Error('Invalid user ID');
      err.statusCode = 400;
      throw err;
    }

    const { rows: currentRows } = await pool.query(
      `SELECT id, role, is_active
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!currentRows.length) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const currentUser = currentRows[0];

    if (currentUser.role === 'admin') {
      if (req.body.role !== undefined && req.body.role !== 'admin') {
        const err = new Error('The only admin account cannot be changed to a different role');
        err.statusCode = 409;
        throw err;
      }

      if (req.body.isActive === false) {
        const err = new Error('The only admin account cannot be deactivated');
        err.statusCode = 409;
        throw err;
      }
    }

    if (req.body.role === 'admin' && currentUser.role !== 'admin') {
      const existingAdmin = await getExistingAdmin();
      if (existingAdmin) {
        const err = new Error('Only one admin account is allowed');
        err.statusCode = 409;
        throw err;
      }
    }

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (req.body.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(req.body.name);
    }

    if (req.body.email !== undefined) {
      const { rows: emailCheckRows } = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [req.body.email, userId]
      );
      if (emailCheckRows.length) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        throw err;
      }
      fields.push(`email = $${paramIdx++}`);
      values.push(req.body.email);
    }

    if (req.body.role !== undefined) {
      fields.push(`role = $${paramIdx++}`);
      values.push(req.body.role);
    }
    if (req.body.username !== undefined) {
      fields.push(`username = $${paramIdx++}`);
      values.push(req.body.username);
    }
    if (req.body.isActive !== undefined) {
      fields.push(`is_active = $${paramIdx++}`);
      values.push(req.body.isActive);
    }
    if (req.body.password !== undefined) {
      const passwordHash = await hashPassword(req.body.password);
      fields.push(`password_hash = $${paramIdx++}`);
      values.push(passwordHash);
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING id, name, email, username, role, is_active, updated_at`,
      values
    );

    if (!rows.length) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
}
