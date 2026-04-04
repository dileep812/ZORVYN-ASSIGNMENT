import express from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validation/schemas.validation.js';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', validateBody(loginSchema), login);

export default router;
