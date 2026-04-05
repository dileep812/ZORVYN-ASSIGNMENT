import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateOwnProfileSchema } from '../validation/schemas.validation.js';
import { currentUser, updateOwnProfile } from '../controllers/auth.controller.js';

const router = express.Router();

router.use(isToken);

router.get('/', currentUser);
router.patch('/profile', validateBody(updateOwnProfileSchema), updateOwnProfile);

export default router;
