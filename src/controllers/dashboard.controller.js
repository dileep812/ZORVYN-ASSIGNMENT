import pool from '../db/connection.db.js';

export async function getDashboard(req, res, next) {
  try {
    const { startDate, endDate } = req.validatedQuery || req.query;

    if (startDate && endDate && startDate > endDate) {
      const err = new Error('startDate cannot be after endDate');
      err.statusCode = 400;
      throw err;
    }

    const where = ['is_deleted = FALSE'];
    const values = [];

    if (startDate) {
      values.push(startDate);
      where.push(`record_date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      where.push(`record_date <= $${values.length}`);
    }

    const whereClause = where.join(' AND ');

    // Fetch all summary data in parallel
    const [totals, categories, recent, trends] = await Promise.all([
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric(12,2) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric(12,2) as total_expenses
         FROM financial_records WHERE ${whereClause}`,
        values
      ),
      pool.query(
        `SELECT category, COALESCE(SUM(amount), 0)::numeric(12,2) as total
         FROM financial_records WHERE ${whereClause}
         GROUP BY category ORDER BY total DESC`,
        values
      ),
      pool.query(
        `SELECT id, amount, type, category, record_date, notes, created_at
         FROM financial_records WHERE ${whereClause}
         ORDER BY created_at DESC LIMIT 5`,
        values
      ),
      pool.query(
        `SELECT
          TO_CHAR(DATE_TRUNC('month', record_date), 'YYYY-MM') as month,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric(12,2) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric(12,2) as expense
         FROM financial_records WHERE ${whereClause}
         GROUP BY DATE_TRUNC('month', record_date)
         ORDER BY DATE_TRUNC('month', record_date) ASC`,
        values
      ),
    ]);

    const totalIncome = Number(totals.rows[0].total_income);
    const totalExpenses = Number(totals.rows[0].total_expenses);

    res.json({
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: Number((totalIncome - totalExpenses).toFixed(2)),
        },
        categoryTotals: categories.rows,
        recentActivity: recent.rows,
        monthlyTrend: trends.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}
