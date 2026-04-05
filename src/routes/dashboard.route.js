import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { dashboardQuerySchema } from '../validation/schemas.validation.js';
import { getDashboard } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(isToken);

// Dashboard summary (viewer, analyst, admin can read)
router.get('/dashboard', requireRole('viewer', 'analyst', 'admin'), validateQuery(dashboardQuerySchema), getDashboard);

export default router;
