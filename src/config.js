import dotenv from 'dotenv';

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: '1h',
  jwtCookieName: 'access_token',
  cookieSecure: (process.env.NODE_ENV || 'development') === 'production',
  cookieSameSite: 'lax',
  cookieDomain: undefined,
  jsonBodyLimit: '100kb',
  authLoginWindowMs: 15 * 60 * 1000,
  authLoginMaxAttempts: 10,
};

config.isProduction = config.nodeEnv === 'production';

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and set it.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Copy .env.example to .env and set it.');
}

if (config.isProduction && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters for production safety.');
}

if (config.isProduction && !config.cookieSecure) {
  throw new Error('COOKIE_SECURE must be true in production.');
}

export default config;
