import pool from '../db/connection.db.js';
import { createError } from '../utils/error.utils.js';

export async function listRecords(req, res, next) {
  try {
    const { type, category, startDate, endDate, page, limit } = req.validatedQuery || {};

    const where = ['is_deleted = FALSE'];
    const values = [];

    if (type) {
      values.push(type);
      where.push(`type = $${values.length}`);
    }
    if (category) {
      values.push(category);
      where.push(`category ILIKE $${values.length}`);
    }
    if (startDate) {
      values.push(startDate);
      where.push(`record_date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      where.push(`record_date <= $${values.length}`);
    }

    if (startDate && endDate && startDate > endDate) {
      throw createError('startDate cannot be after endDate', 400);
    }

    const offset = (page - 1) * limit;
    values.push(limit);
    values.push(offset);

    const whereClause = where.join(' AND ');
    const { rows: records } = await pool.query(
      `SELECT id, amount, type, category, record_date, notes, created_by, created_at, updated_at
       FROM financial_records
       WHERE ${whereClause}
       ORDER BY record_date DESC, id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*)::int as total FROM financial_records WHERE ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    res.json({
      data: records,
      meta: { page, limit, total: countResult[0].total },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRecord(req, res, next) {
  try {
    const { amount, type, category, date, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO financial_records (amount, type, category, record_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, amount, type, category, record_date, notes, created_by, created_at, updated_at`,
      [amount, type, category, date, notes ?? '', req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req, res, next) {
  try {
    const recordId = Number(req.params.id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      throw createError('Invalid record ID', 400);
    }

    const { amount, type, category, date, notes } = req.body;

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (amount !== undefined) {
      fields.push(`amount = $${paramIdx++}`);
      values.push(amount);
    }
    if (type !== undefined) {
      fields.push(`type = $${paramIdx++}`);
      values.push(type);
    }
    if (category !== undefined) {
      fields.push(`category = $${paramIdx++}`);
      values.push(category);
    }
    if (date !== undefined) {
      fields.push(`record_date = $${paramIdx++}`);
      values.push(date);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramIdx++}`);
      values.push(notes);
    }

    fields.push(`updated_at = NOW()`);

    values.push(recordId);

    const { rows } = await pool.query(
      `UPDATE financial_records
       SET ${fields.join(', ')}
       WHERE id = $${paramIdx} AND is_deleted = FALSE
       RETURNING id, amount, type, category, record_date, notes, created_by, created_at, updated_at`,
      values
    );

    if (!rows.length) {
      throw createError('Record not found', 404);
    }

    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req, res, next) {
  try {
    const recordId = Number(req.params.id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      throw createError('Invalid record ID', 400);
    }

    const { rows } = await pool.query(
      `UPDATE financial_records
       SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
      [recordId]
    );

    if (!rows.length) {
      throw createError('Record not found', 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
