import pool from '../db/connection.db.js';

// Dynamic UPDATE query builder
export function buildUpdateQuery(updates, id, table) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No fields to update');
  }

  const fields = [];
  const values = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIdx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  
  return { sql, params: values };
}

// Execute dynamic UPDATE
export async function executeUpdate(updates, id, table) {
  const { sql, params } = buildUpdateQuery(updates, id, table);
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

// Dynamic INSERT query builder
export async function executeInsert(fields, values, table, returningCols = '*') {
  if (!fields || fields.length === 0) {
    throw new Error('No fields to insert');
  }

  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING ${returningCols}`;
  
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
}

// Create a new user with provided fields
export async function createNewUser(userData) {
  const fields = [];
  const values = [];
  
  if (userData.name) { fields.push('name'); values.push(userData.name); }
  if (userData.email) { fields.push('email'); values.push(userData.email); }
  if (userData.username) { fields.push('username'); values.push(userData.username); }
  if (userData.password_hash) { fields.push('password_hash'); values.push(userData.password_hash); }
  if (userData.role) { fields.push('role'); values.push(userData.role); }
  if (userData.is_active !== undefined) { fields.push('is_active'); values.push(userData.is_active); }
  
  return executeInsert(fields, values, 'users', 'id, name, email, username, role, is_active, created_at');
}

// Create a new financial record
export async function createNewRecord(recordData) {
  const fields = [];
  const values = [];
  
  if (recordData.amount) { fields.push('amount'); values.push(recordData.amount); }
  if (recordData.type) { fields.push('type'); values.push(recordData.type); }
  if (recordData.category) { fields.push('category'); values.push(recordData.category); }
  if (recordData.record_date) { fields.push('record_date'); values.push(recordData.record_date); }
  if (recordData.notes) { fields.push('notes'); values.push(recordData.notes); }
  if (recordData.created_by) { fields.push('created_by'); values.push(recordData.created_by); }
  
  return executeInsert(fields, values, 'financial_records', 'id, amount, type, category, record_date, notes, created_by, created_at, updated_at');
}

// Common record queries
export async function getRecordById(recordId) {
  const { rows } = await pool.query(
    `SELECT id, amount, type, category, record_date, notes, created_by, created_at, updated_at 
     FROM financial_records WHERE id = $1 AND is_deleted = false`,
    [recordId]
  );
  return rows[0] || null;
}

export async function listRecords(startDate, endDate, offset = 0, limit = 10) {
  const { rows } = await pool.query(
    `SELECT id, amount, type, category, record_date, notes, created_by, created_at, updated_at 
     FROM financial_records 
     WHERE is_deleted = false AND record_date BETWEEN $1 AND $2 
     ORDER BY record_date DESC 
     LIMIT $3 OFFSET $4`,
    [startDate, endDate, limit, offset]
  );
  return rows;
}

export async function getRecordsCount(startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM financial_records 
     WHERE is_deleted = false AND record_date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );
  return parseInt(rows[0].count, 10);
}

export async function getDashboardSummary(period = 'week') {
  const periodQuery = period === 'month' 
    ? "DATE_TRUNC('month', record_date)" 
    : "DATE_TRUNC('week', record_date)";

  const { rows } = await pool.query(`
    SELECT 
      ${periodQuery} as period,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM financial_records
    WHERE is_deleted = false
    GROUP BY ${periodQuery}
    ORDER BY period DESC
    LIMIT 12
  `);
  return rows;
}

export async function getSoftDeletedCount(table) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM ${table} WHERE is_deleted = true`
  );
  return parseInt(rows[0].count, 10);
}
