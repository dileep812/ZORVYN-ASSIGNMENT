import { hashPassword } from '../security/auth.security.js';
import { createError } from '../utils/error.utils.js';
import { getAllUsers, checkEmailUnique, checkUsernameUnique, getAdminUser } from '../utils/user.queries.js';
import { validateUserId } from '../utils/validation.utils.js';
import { getUserById } from '../utils/user.queries.js';
import { executeUpdate, createNewUser } from '../utils/db.queries.js';

export async function listUsers(req, res, next) {
  try {
    const rows = await getAllUsers();
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, username, password, role, isActive } = req.body;

    // Check email uniqueness before creation
    const emailUnique = await checkEmailUnique(email);
    if (!emailUnique) {
      throw createError('Email already in use', 409);
    }

    // Check username uniqueness before creation
    const usernameUnique = await checkUsernameUnique(username);
    if (!usernameUnique) {
      throw createError('Username already taken', 409);
    }

    if (role === 'admin') {
      const existingAdmin = await getAdminUser();
      if (existingAdmin) {
        throw createError('Only one admin account is allowed', 409);
      }
    }

    const passwordHash = await hashPassword(password);
    const result = await createNewUser({
      name,
      email,
      username,
      password_hash: passwordHash,
      role,
      is_active: isActive
    });
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    validateUserId(userId);

    const currentUser = await getUserById(userId, 'id, role');
    if (!currentUser) {
      throw createError('User not found', 404);
    }

    // Admin protection - only applies if admin trying to modify themselves or another admin
    if (currentUser.role === 'admin') {
      // Cannot change admin to different role
      if (req.body.role !== undefined && req.body.role !== 'admin') {
        throw createError('The only admin account cannot be changed to a different role', 409);
      }
      // Cannot deactivate admin (prevents deactivating any admin account)
      if (req.body.isActive === false) {
        throw createError('Admin accounts cannot be deactivated', 409);
      }
    }

    // Admin cannot deactivate themselves via their own profile
    if (userId === req.user.id && req.body.isActive === false) {
      throw createError('You cannot deactivate your own account', 409);
    }

    // Check if promoting to admin
    if (req.body.role === 'admin' && currentUser.role !== 'admin') {
      const existingAdmin = await getAdminUser();
      if (existingAdmin) {
        throw createError('Only one admin account is allowed', 409);
      }
    }

    // Build update object
    const updateFields = {};
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    
    if (req.body.email !== undefined) {
      const emailUnique = await checkEmailUnique(req.body.email, userId);
      if (!emailUnique) {
        throw createError('Email already in use', 409);
      }
      updateFields.email = req.body.email;
    }

    if (req.body.username !== undefined) {
      const usernameUnique = await checkUsernameUnique(req.body.username, userId);
      if (!usernameUnique) {
        throw createError('Username already taken', 409);
      }
      updateFields.username = req.body.username;
    }
    if (req.body.role !== undefined) updateFields.role = req.body.role;
    if (req.body.isActive !== undefined) updateFields.is_active = req.body.isActive;
    
    updateFields.updated_at = new Date().toISOString();
    const result = await executeUpdate(updateFields, userId, 'users');
    
    if (!result) {
      throw createError('User not found', 404);
    }
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
