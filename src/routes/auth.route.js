import express from 'express';
import { isToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validation/schemas.validation.js';
import { login, logout } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', isToken, logout);

export default router;
