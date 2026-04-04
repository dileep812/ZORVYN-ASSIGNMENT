// Main HTTP entrypoint: wires middleware/routes and starts the Express server.
import config from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import authRouter from './routes/auth.route.js';
import meRouter from './routes/me.route.js';
import usersRouter from './routes/users.route.js';
import recordsRouter from './routes/records.route.js';
import dashboardRouter from './routes/dashboard.route.js';

const app = express();

// Security and logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public auth routes
app.use('/api/auth', authRouter);

// Protected API routes
app.use('/api', requireAuth);

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
