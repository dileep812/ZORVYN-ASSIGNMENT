import pool from '../db/connection.db.js';
import { createError } from '../utils/error.utils.js';

export async function getDashboard(req, res, next) {
  try {
    const { startDate, endDate } = req.validatedQuery || {};

    if (startDate && endDate && startDate > endDate) {
      throw createError('startDate cannot be after endDate', 400);
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

export async function getDashboardInsights(req, res, next) {
  try {
    const { startDate, endDate, interval } = req.validatedQuery || {};

    if (startDate && endDate && startDate > endDate) {
      throw createError('startDate cannot be after endDate', 400);
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
    const bucket = interval === 'month' ? 'month' : 'week';
    const periodLabel = interval === 'month'
      ? "TO_CHAR(DATE_TRUNC('month', record_date), 'YYYY-MM')"
      : "TO_CHAR(DATE_TRUNC('week', record_date), 'IYYY-\"W\"IW')";

    const [totalsResult, trendResult, categoryResult] = await Promise.all([
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric(12,2) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric(12,2) as total_expenses,
          COUNT(*)::int as records_count,
          COUNT(DISTINCT DATE_TRUNC('${bucket}', record_date))::int as periods_count
         FROM financial_records
         WHERE ${whereClause}`,
        values
      ),
      pool.query(
        `SELECT
          ${periodLabel} as period,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric(12,2) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric(12,2) as expense
         FROM financial_records
         WHERE ${whereClause}
         GROUP BY DATE_TRUNC('${bucket}', record_date)
         ORDER BY DATE_TRUNC('${bucket}', record_date) ASC`,
        values
      ),
      pool.query(
        `SELECT
          category,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric(12,2) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric(12,2) as expense,
          COALESCE(SUM(amount), 0)::numeric(12,2) as total
         FROM financial_records
         WHERE ${whereClause}
         GROUP BY category
         ORDER BY total DESC`,
        values
      ),
    ]);

    const totals = totalsResult.rows[0] || {};
    const totalIncome = Number(totals.total_income || 0);
    const totalExpenses = Number(totals.total_expenses || 0);
    const netBalance = Number((totalIncome - totalExpenses).toFixed(2));
    const periodsCount = Number(totals.periods_count || 0);

    const periodTrend = trendResult.rows.map((row) => {
      const income = Number(row.income);
      const expense = Number(row.expense);
      return {
        period: row.period,
        income: row.income,
        expense: row.expense,
        net: Number((income - expense).toFixed(2)),
      };
    });

    const topExpenseCategories = categoryResult.rows
      .filter((row) => Number(row.expense) > 0)
      .slice(0, 5)
      .map((row) => ({ category: row.category, totalExpense: row.expense }));

    const topIncomeCategories = categoryResult.rows
      .filter((row) => Number(row.income) > 0)
      .slice(0, 5)
      .map((row) => ({ category: row.category, totalIncome: row.income }));

    res.json({
      data: {
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          interval: bucket,
        },
        metrics: {
          totalIncome,
          totalExpenses,
          netBalance,
          recordsCount: Number(totals.records_count || 0),
          periodsCount,
          averageIncomePerPeriod: periodsCount > 0 ? Number((totalIncome / periodsCount).toFixed(2)) : 0,
          averageExpensePerPeriod: periodsCount > 0 ? Number((totalExpenses / periodsCount).toFixed(2)) : 0,
          savingsRate: totalIncome > 0 ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2)) : 0,
          expenseToIncomeRatio: totalIncome > 0 ? Number((totalExpenses / totalIncome).toFixed(4)) : null,
        },
        trend: periodTrend,
        topExpenseCategories,
        topIncomeCategories,
      },
    });
  } catch (error) {
    next(error);
  }
}
