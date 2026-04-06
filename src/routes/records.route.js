import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  recordCreateManySchema,
  recordUpdateSchema,
  recordListSchema,
} from '../validation/schemas.validation.js';
import { listRecords, createRecord, updateRecord, deleteRecord } from '../controllers/record.controller.js';

const router = express.Router();

router.use(isToken);

// List financial records with filtering by date, category, and type (analyst and admin only)
router.get('/', requireRole('analyst', 'admin'), validateQuery(recordListSchema), listRecords);

// Create one or many financial records (admin only)
router.post('/', requireRole('admin'), validateBody(recordCreateManySchema), createRecord);

// Update financial record (admin only)
router.patch('/:id', requireRole('admin'), validateBody(recordUpdateSchema), updateRecord);

// Soft delete record (admin only)
router.delete('/:id', requireRole('admin'), deleteRecord);

export default router;
