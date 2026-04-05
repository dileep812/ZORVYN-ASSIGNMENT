import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { userCreateSchema, userUpdateSchema } from '../validation/schemas.validation.js';
import { listUsers, createUser, updateUser } from '../controllers/user.controller.js';

const router = express.Router();

router.use(isToken);

// Get all users (admin only)
router.get('/', requireRole('admin'), listUsers);

// Create user (admin only)
router.post('/', requireRole('admin'), validateBody(userCreateSchema), createUser);

// Update user (admin only)
router.patch('/:id', requireRole('admin'), validateBody(userUpdateSchema), updateUser);

export default router;
