import dotenv from 'dotenv';

dotenv.config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
}

function parseNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function normalizeSameSite(value) {
  const sameSite = String(value || 'lax').toLowerCase();
  if (sameSite === 'strict' || sameSite === 'none') {
    return sameSite;
  }
  return 'lax';
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'access_token',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, false),
  cookieSameSite: normalizeSameSite(process.env.COOKIE_SAMESITE),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  trustProxy: process.env.TRUST_PROXY || undefined,
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '100kb',
  authLoginWindowMs: parseNumber(process.env.AUTH_LOGIN_WINDOW_MS, 15 * 60 * 1000),
  authLoginMaxAttempts: parseNumber(process.env.AUTH_LOGIN_MAX_ATTEMPTS, 10),
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

if (config.cookieSameSite === 'none' && !config.cookieSecure) {
  throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
}

if (config.isProduction && !config.cookieSecure) {
  throw new Error('COOKIE_SECURE must be true in production.');
}

export default config;
