import { createError } from './error.utils.js';
import { getAdminUser, getUserById } from './user.queries.js';

// Check if user can be deactivated
export async function canDeactivateUser(targetUserId, currentUserId, currentUserRole) {
  // Normal users cannot deactivate themselves
  if (targetUserId === currentUserId && currentUserRole !== 'admin') {
    throw createError('Users cannot deactivate their own account', 403);
  }

  // Admin cannot deactivate himself
  if (targetUserId === currentUserId && currentUserRole === 'admin') {
    throw createError('Admin cannot deactivate their own account', 403);
  }

  // Only admin can deactivate others
  if (currentUserRole !== 'admin') {
    throw createError('Only admin can deactivate users', 403);
  }

  return true;
}

// Check if user can reactivate
export async function canReactivateUser(currentUserRole) {
  // Only admin can reactivate users
  if (currentUserRole !== 'admin') {
    throw createError('Only admin can reactivate users', 403);
  }
  return true;
}

// Verify admin exists (for role-based operations)
export async function verifyAdminExists() {
  const admin = await getAdminUser();
  if (!admin) {
    throw createError('No admin user found', 500);
  }
  return admin;
}

// Check if target user is admin
export async function isAdminUser(userId) {
  const user = await getUserById(userId);
  return user && user.role === 'admin';
}

// Verify user not already admin
export async function verifyNotAdmin(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw createError('User not found', 404);
  }
  if (user.role === 'admin') {
    throw createError('User is already admin', 400);
  }
  return user;
}

// Prevent if would create duplicate admin
export async function checkAdminLimit() {
  const admin = await getAdminUser();
  if (!admin) {
    throw createError('Cannot remove last admin', 400);
  }
  return admin;
}
