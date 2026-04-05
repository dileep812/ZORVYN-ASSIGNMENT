import express from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config.js';
import { isTokenAllowInactive } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validation/schemas.validation.js';
import { login, logout } from '../controllers/auth.controller.js';

const router = express.Router();

const loginRateLimiter = rateLimit({
	windowMs: config.authLoginWindowMs,
	limit: config.authLoginMaxAttempts,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginRateLimiter, validateBody(loginSchema), login);
router.post('/logout', isTokenAllowInactive, logout);

export default router;
