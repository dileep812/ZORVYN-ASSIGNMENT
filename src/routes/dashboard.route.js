import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { dashboardQuerySchema, dashboardInsightsQuerySchema } from '../validation/schemas.validation.js';
import { getDashboard, getDashboardInsights } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(isToken);

// Dashboard summary (viewer, analyst, admin can read)
router.get('/', requireRole('viewer', 'analyst', 'admin'), validateQuery(dashboardQuerySchema), getDashboard);

// Deeper dashboard insights (analyst and admin only)
router.get('/insights', requireRole('analyst', 'admin'), validateQuery(dashboardInsightsQuerySchema), getDashboardInsights);

export default router;
