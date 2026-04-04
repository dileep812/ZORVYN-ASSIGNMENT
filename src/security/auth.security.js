import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
