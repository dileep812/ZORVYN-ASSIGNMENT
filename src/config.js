import dotenv from 'dotenv';

dotenv.config();

function normalizeSameSite(value) {
  const sameSite = String(value || 'lax').toLowerCase();
  if (sameSite === 'strict' || sameSite === 'none') {
    return sameSite;
  }
  return 'lax';
}

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'access_token',
  cookieSecure: String(process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
  cookieSameSite: normalizeSameSite(process.env.COOKIE_SAMESITE),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  corsOrigin: process.env.CORS_ORIGIN || undefined,
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and set it.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Copy .env.example to .env and set it.');
}

export default config;
