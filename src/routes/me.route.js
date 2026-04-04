import express from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { changePasswordSchema } from '../validation/schemas.validation.js';
import { currentUser, changeOwnPassword } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/', currentUser);
router.patch('/password', validateBody(changePasswordSchema), changeOwnPassword);

export default router;
