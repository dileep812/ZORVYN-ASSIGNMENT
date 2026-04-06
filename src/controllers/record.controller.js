import pool from '../db/connection.db.js';
import { createError } from '../utils/error.utils.js';
import { validateRecordId, validateDateRange, validatePositiveNumber } from '../utils/validation.utils.js';
import { executeUpdate, createNewRecord } from '../utils/db.queries.js';

export async function listRecords(req, res, next) {
  try {
    const { type, category, startDate, endDate, page, limit } = req.validatedQuery || {};

    // Validate date range if both provided
    if (startDate && endDate) {
      validateDateRange(startDate, endDate);
    }

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
    const records = req.body.records;

    const createdRecords = [];
    for (const item of records) {
      const { amount, type, category, date, notes } = item;

      // Defensive validation (schema already validates)
      validatePositiveNumber(amount, 'amount');

      const result = await createNewRecord({
        amount,
        type,
        category,
        record_date: date,
        notes: notes ?? '',
        created_by: req.user.id,
      });
      createdRecords.push(result);
    }

    if (createdRecords.length === 1) {
      res.status(201).json({ data: createdRecords[0] });
      return;
    }

    res.status(201).json({
      data: createdRecords,
      meta: { created: createdRecords.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req, res, next) {
  try {
    const recordId = Number(req.params.id);
    validateRecordId(recordId);

    const { amount, type, category, date, notes } = req.body;

    const updateFields = {};
    if (amount !== undefined) {
      validatePositiveNumber(amount, 'amount');
      updateFields.amount = amount;
    }
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (date !== undefined) updateFields.record_date = date;
    if (notes !== undefined) updateFields.notes = notes;

    // Update will soft-delete check using WHERE clause
    // Need to first verify record exists and is not deleted
    const result = await pool.query(
      `UPDATE financial_records
       SET amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category = COALESCE($3, category),
           record_date = COALESCE($4, record_date),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 AND is_deleted = FALSE
       RETURNING id, amount, type, category, record_date, notes, created_by, created_at, updated_at`,
      [updateFields.amount, updateFields.type, updateFields.category, updateFields.record_date, updateFields.notes, recordId]
    );

    if (!result.rows.length) {
      throw createError('Record not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req, res, next) {
  try {
    const recordId = Number(req.params.id);
    validateRecordId(recordId);

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
