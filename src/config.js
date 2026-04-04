import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and set it.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Copy .env.example to .env and set it.');
}

export default config;
