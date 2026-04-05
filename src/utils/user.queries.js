import pool from '../db/connection.db.js';

// Common user queries
export async function getUserById(userId, columns = 'id, name, email, username, role, is_active') {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT id, name, email, username, role, is_active, password_hash FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
}

export async function checkUsernameUnique(username, excludeUserId = null) {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE username = $1 AND id != $2'
    : 'SELECT id FROM users WHERE username = $1';
  const params = excludeUserId ? [username, excludeUserId] : [username];
  const { rows } = await pool.query(query, params);
  return rows.length === 0;
}

export async function checkEmailUnique(email, excludeUserId = null) {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE email = $1 AND id != $2'
    : 'SELECT id FROM users WHERE email = $1';
  const params = excludeUserId ? [email, excludeUserId] : [email];
  const { rows } = await pool.query(query, params);
  return rows.length === 0;
}

export async function getAdminUser() {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );
  return rows[0] || null;
}

export async function getAllUsers() {
  const { rows } = await pool.query(
    'SELECT id, name, email, username, role, is_active, created_at FROM users ORDER BY id'
  );
  return rows;
}
