import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  recordCreateSchema,
  recordUpdateSchema,
  recordListSchema,
} from '../validation/schemas.validation.js';
import { listRecords, createRecord, updateRecord, deleteRecord } from '../controllers/record.controller.js';

const router = express.Router();

router.use(isToken);

// List all financial records (analyst and admin can read)
router.get('/', requireRole('analyst', 'admin'), validateQuery(recordListSchema), listRecords);

// Create financial record (admin only)
router.post('/', requireRole('admin'), validateBody(recordCreateSchema), createRecord);

// Update financial record (admin only) with optimistic locking
router.patch('/:id', requireRole('admin'), validateBody(recordUpdateSchema), updateRecord);

// Soft delete record (admin only)
router.delete('/:id', requireRole('admin'), deleteRecord);

export default router;
