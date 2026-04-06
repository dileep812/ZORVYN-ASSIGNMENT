// Main HTTP entrypoint: wires middleware/routes and starts the Express server.
import config from './config.js';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import authRouter from './routes/auth.route.js';
import meRouter from './routes/me.route.js';
import usersRouter from './routes/users.route.js';
import recordsRouter from './routes/records.route.js';
import dashboardRouter from './routes/dashboard.route.js';

const app = express();

const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many health requests. Please try again later.' },
});

// Security and logging middleware
app.use(helmet());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(cookieParser());

// Health check (no auth required)
app.get('/health', healthRateLimiter, (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Public auth routes
app.use('/api/auth', authRouter);

// Current user and password change routes
app.use('/api/me', meRouter);

// API routes
app.use('/api/users', usersRouter);
app.use('/api/records', recordsRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✓ Server listening on port ${config.port}`);
});
