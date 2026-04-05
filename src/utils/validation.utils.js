import { createError } from './error.utils.js';

// ID validation
export function validateUserId(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError('Invalid user ID', 400);
  }
  return userId;
}

export function validateRecordId(recordId) {
  if (!Number.isInteger(recordId) || recordId <= 0) {
    throw createError('Invalid record ID', 400);
  }
  return recordId;
}

// Date validation
export function validateDateRange(startDate, endDate, fieldNames = { start: 'startDate', end: 'endDate' }) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw createError(`Invalid date format for ${fieldNames.start} or ${fieldNames.end}`, 400);
    }

    if (start > end) {
      throw createError(`${fieldNames.start} cannot be after ${fieldNames.end}`, 400);
    }
  }
  return { startDate, endDate };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError('Invalid email format', 400);
  }
  return email;
}

export function validateUsername(username) {
  if (!username || username.length < 3) {
    throw createError('Username must be at least 3 characters', 400);
  }
  return username;
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    throw createError('Password must be at least 6 characters', 400);
  }
  return password;
}

export function validateRole(role) {
  const validRoles = ['viewer', 'analyst', 'admin'];
  if (!validRoles.includes(role)) {
    throw createError(`Role must be one of: ${validRoles.join(', ')}`, 400);
  }
  return role;
}

export function validatePositiveNumber(value, fieldName = 'amount') {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw createError(`${fieldName} must be a positive number`, 400);
  }
  return num;
}
