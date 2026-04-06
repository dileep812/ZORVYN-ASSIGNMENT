function success(data) {
  return { success: true, data };
}

function failure(issues) {
  return { success: false, issues };
}

function isValidDateString(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));

  return d.getUTCFullYear() === year
    && d.getUTCMonth() + 1 === month
    && d.getUTCDate() === day;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function isRole(value) {
  return value === 'viewer' || value === 'analyst' || value === 'admin';
}

function isRecordType(value) {
  return value === 'income' || value === 'expense';
}

function isValidUsername(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_.-]{3,30}$/.test(value);
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addUnknownFieldIssues(input, allowedFields, issues) {
  for (const key of Object.keys(input)) {
    if (!allowedFields.includes(key)) {
      issues.push({ field: key, message: 'Unknown field is not allowed' });
    }
  }
}

export function userCreateSchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'body', message: 'Request body must be an object' }]);
  }

  addUnknownFieldIssues(input, ['name', 'email', 'username', 'password', 'role', 'isActive'], issues);

  const name = normalizeString(input?.name);
  if (typeof name !== 'string' || name.length < 2 || name.length > 120) {
    issues.push({ field: 'name', message: 'Name must be between 2 and 120 characters' });
  } else {
    data.name = name;
  }

  const email = normalizeString(input?.email);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || !emailPattern.test(email)) {
    issues.push({ field: 'email', message: 'Invalid email format' });
  } else {
    data.email = email.toLowerCase();
  }

  const username = normalizeString(input?.username);
  if (!isValidUsername(username)) {
    issues.push({ field: 'username', message: 'Username must be 3-30 chars and contain only letters, numbers, _, -, or .' });
  } else {
    data.username = username.toLowerCase();
  }

  if (!isValidPassword(input?.password)) {
    issues.push({ field: 'password', message: 'Password must be between 8 and 72 characters' });
  } else {
    data.password = input.password;
  }

  if (!isRole(input?.role)) {
    issues.push({ field: 'role', message: 'Role must be viewer, analyst, or admin' });
  } else {
    data.role = input.role;
  }

  if (input?.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      issues.push({ field: 'isActive', message: 'isActive must be a boolean' });
    } else {
      data.isActive = input.isActive;
    }
  } else {
    data.isActive = true;
  }

  return issues.length ? failure(issues) : success(data);
}

export function userUpdateSchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'body', message: 'Request body must be an object' }]);
  }

  addUnknownFieldIssues(input, ['name', 'email', 'username', 'role', 'isActive'], issues);

  if (input?.name !== undefined) {
    const name = normalizeString(input.name);
    if (typeof name !== 'string' || name.length < 2 || name.length > 120) {
      issues.push({ field: 'name', message: 'Name must be between 2 and 120 characters' });
    } else {
      data.name = name;
    }
  }

  if (input?.email !== undefined) {
    const email = normalizeString(input.email);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailPattern.test(email)) {
      issues.push({ field: 'email', message: 'Invalid email format' });
    } else {
      data.email = email.toLowerCase();
    }
  }

  if (input?.role !== undefined) {
    if (!isRole(input.role)) {
      issues.push({ field: 'role', message: 'Role must be viewer, analyst, or admin' });
    } else {
      data.role = input.role;
    }
  }

  if (input?.username !== undefined) {
    const username = normalizeString(input.username);
    if (!isValidUsername(username)) {
      issues.push({ field: 'username', message: 'Username must be 3-30 chars and contain only letters, numbers, _, -, or .' });
    } else {
      data.username = username.toLowerCase();
    }
  }

  if (input?.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      issues.push({ field: 'isActive', message: 'isActive must be a boolean' });
    } else {
      data.isActive = input.isActive;
    }
  }

  if (Object.keys(input).length === 0) {
    issues.push({ field: 'body', message: 'At least one field required' });
  }

  if (Object.keys(data).length === 0 && Object.keys(input).length > 0) {
    issues.push({ field: 'body', message: 'At least one valid updatable field required' });
  }

  return issues.length ? failure(issues) : success(data);
}

function validateRecordCreateItem(input, pathPrefix = '') {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return {
      issues: [{ field: `${pathPrefix}body`, message: 'Request body must be an object' }],
      data,
    };
  }

  addUnknownFieldIssues(input, ['amount', 'type', 'category', 'date', 'notes'], issues);

  if (typeof input?.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
    issues.push({ field: `${pathPrefix}amount`, message: 'Amount must be greater than 0' });
  } else {
    data.amount = input.amount;
  }

  if (!isRecordType(input?.type)) {
    issues.push({ field: `${pathPrefix}type`, message: 'Type must be income or expense' });
  } else {
    data.type = input.type;
  }

  const category = normalizeString(input?.category);
  if (typeof category !== 'string' || category.length < 1 || category.length > 100) {
    issues.push({ field: `${pathPrefix}category`, message: 'Category must be between 1 and 100 characters' });
  } else {
    data.category = category;
  }

  if (!isValidDateString(input?.date)) {
    issues.push({ field: `${pathPrefix}date`, message: 'Invalid date format (YYYY-MM-DD)' });
  } else {
    data.date = input.date;
  }

  if (input?.notes !== undefined) {
    const notes = normalizeString(input.notes);
    if (typeof notes !== 'string' || notes.length > 500) {
      issues.push({ field: `${pathPrefix}notes`, message: 'Notes must be at most 500 characters' });
    } else {
      data.notes = notes;
    }
  }

  return { issues, data };
}

export function recordCreateSchema(input) {
  const { issues, data } = validateRecordCreateItem(input);
  return issues.length ? failure(issues) : success(data);
}

export function recordCreateManySchema(input) {
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return failure([{ field: 'body', message: 'Request body array must contain at least one record' }]);
    }
    if (input.length > 100) {
      return failure([{ field: 'body', message: 'A maximum of 100 records can be created per request' }]);
    }

    const issues = [];
    const records = [];
    input.forEach((item, index) => {
      const result = validateRecordCreateItem(item, `records[${index}].`);
      issues.push(...result.issues);
      if (result.issues.length === 0) {
        records.push(result.data);
      }
    });

    return issues.length ? failure(issues) : success({ records });
  }

  const single = validateRecordCreateItem(input);
  if (single.issues.length) {
    return failure(single.issues);
  }

  return success({ records: [single.data] });
}

export function recordUpdateSchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'body', message: 'Request body must be an object' }]);
  }

  addUnknownFieldIssues(input, ['amount', 'type', 'category', 'date', 'notes'], issues);

  if (input?.amount !== undefined) {
    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
      issues.push({ field: 'amount', message: 'Amount must be greater than 0' });
    } else {
      data.amount = input.amount;
    }
  }

  if (input?.type !== undefined) {
    if (!isRecordType(input.type)) {
      issues.push({ field: 'type', message: 'Type must be income or expense' });
    } else {
      data.type = input.type;
    }
  }

  if (input?.category !== undefined) {
    const category = normalizeString(input.category);
    if (typeof category !== 'string' || category.length < 1 || category.length > 100) {
      issues.push({ field: 'category', message: 'Category must be between 1 and 100 characters' });
    } else {
      data.category = category;
    }
  }

  if (input?.date !== undefined) {
    if (!isValidDateString(input.date)) {
      issues.push({ field: 'date', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.date = input.date;
    }
  }

  if (input?.notes !== undefined) {
    if (input.notes !== null) {
      const notes = normalizeString(input.notes);
      if (typeof notes !== 'string' || notes.length > 500) {
        issues.push({ field: 'notes', message: 'Notes must be null or at most 500 characters' });
      } else {
        data.notes = notes;
      }
    } else {
      data.notes = null;
    }
  }

  const hasPatchField = ['amount', 'type', 'category', 'date', 'notes'].some((k) => input?.[k] !== undefined);
  if (!hasPatchField) {
    issues.push({ field: 'body', message: 'At least one field required' });
  }

  return issues.length ? failure(issues) : success(data);
}

export function recordListSchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'query', message: 'Query parameters must be an object' }]);
  }

  addUnknownFieldIssues(input, ['type', 'category', 'startDate', 'endDate', 'page', 'limit'], issues);

  if (input?.type !== undefined) {
    if (!isRecordType(input.type)) {
      issues.push({ field: 'type', message: 'Type must be income or expense' });
    } else {
      data.type = input.type;
    }
  }

  if (input?.category !== undefined) {
    const category = normalizeString(input.category);
    if (typeof category !== 'string' || category.length < 1 || category.length > 100) {
      issues.push({ field: 'category', message: 'Category must be between 1 and 100 characters' });
    } else {
      data.category = category;
    }
  }

  if (input?.startDate !== undefined) {
    if (!isValidDateString(input.startDate)) {
      issues.push({ field: 'startDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.startDate = input.startDate;
    }
  }

  if (input?.endDate !== undefined) {
    if (!isValidDateString(input.endDate)) {
      issues.push({ field: 'endDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.endDate = input.endDate;
    }
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    issues.push({ field: 'startDate', message: 'startDate cannot be after endDate' });
  }

  const pageRaw = input?.page ?? 1;
  const page = Number(pageRaw);
  if (!Number.isInteger(page) || page < 1) {
    issues.push({ field: 'page', message: 'Page must be an integer greater than or equal to 1' });
  } else {
    data.page = page;
  }

  const limitRaw = input?.limit ?? 20;
  const limit = Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    issues.push({ field: 'limit', message: 'Limit must be an integer between 1 and 100' });
  } else {
    data.limit = limit;
  }

  return issues.length ? failure(issues) : success(data);
}

export function dashboardQuerySchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'query', message: 'Query parameters must be an object' }]);
  }

  addUnknownFieldIssues(input, ['startDate', 'endDate'], issues);

  if (input?.startDate !== undefined) {
    if (!isValidDateString(input.startDate)) {
      issues.push({ field: 'startDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.startDate = input.startDate;
    }
  }

  if (input?.endDate !== undefined) {
    if (!isValidDateString(input.endDate)) {
      issues.push({ field: 'endDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.endDate = input.endDate;
    }
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    issues.push({ field: 'startDate', message: 'startDate cannot be after endDate' });
  }

  return issues.length ? failure(issues) : success(data);
}

export function dashboardInsightsQuerySchema(input) {
  const issues = [];
  const data = {};

  if (!isPlainObject(input)) {
    return failure([{ field: 'query', message: 'Query parameters must be an object' }]);
  }

  addUnknownFieldIssues(input, ['startDate', 'endDate', 'interval'], issues);

  if (input?.startDate !== undefined) {
    if (!isValidDateString(input.startDate)) {
      issues.push({ field: 'startDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.startDate = input.startDate;
    }
  }

  if (input?.endDate !== undefined) {
    if (!isValidDateString(input.endDate)) {
      issues.push({ field: 'endDate', message: 'Invalid date format (YYYY-MM-DD)' });
    } else {
      data.endDate = input.endDate;
    }
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    issues.push({ field: 'startDate', message: 'startDate cannot be after endDate' });
  }

  const interval = input?.interval ?? 'week';
  if (interval !== 'week' && interval !== 'month') {
    issues.push({ field: 'interval', message: 'Interval must be week or month' });
  } else {
    data.interval = interval;
  }

  return issues.length ? failure(issues) : success(data);
}

export function loginSchema(input) {
  if (!isPlainObject(input)) {
    return failure([{ field: 'body', message: 'Request body must be an object' }]);
  }

  const issues = [];
  const data = {};
  addUnknownFieldIssues(input, ['username', 'password'], issues);

  const username = normalizeString(input?.username);
  if (!isValidUsername(username)) {
    issues.push({ field: 'username', message: 'Username is required and must be valid' });
  } else {
    data.username = username.toLowerCase();
  }

  if (!isValidPassword(input?.password)) {
    issues.push({ field: 'password', message: 'Password is required and must be between 8 and 72 characters' });
  } else {
    data.password = input.password;
  }

  return issues.length ? failure(issues) : success(data);
}

export function updateOwnProfileSchema(input) {
  if (!isPlainObject(input)) {
    return failure([{ field: 'body', message: 'Request body must be an object' }]);
  }

  const issues = [];
  const data = {};
  addUnknownFieldIssues(input, ['name', 'username', 'newPassword', 'oldPassword', 'isActive'], issues);

  if (input?.name !== undefined) {
    const name = normalizeString(input.name);
    if (typeof name !== 'string' || name.length < 2 || name.length > 120) {
      issues.push({ field: 'name', message: 'Name must be between 2 and 120 characters' });
    } else {
      data.name = name;
    }
  }

  if (input?.username !== undefined) {
    const username = normalizeString(input.username);
    if (!isValidUsername(username)) {
      issues.push({ field: 'username', message: 'Username must be 3-30 chars and contain only letters, numbers, _, -, or .' });
    } else {
      data.username = username.toLowerCase();
    }
  }

  if (input?.newPassword !== undefined) {
    if (!isValidPassword(input.newPassword)) {
      issues.push({ field: 'newPassword', message: 'Password must be between 8 and 72 characters' });
    } else {
      data.newPassword = input.newPassword;
    }
    
    if (!isValidPassword(input?.oldPassword)) {
      issues.push({ field: 'oldPassword', message: 'Old password is required to change password and must be between 8 and 72 characters' });
    } else {
      data.oldPassword = input.oldPassword;
    }

    if (data.newPassword && data.oldPassword && data.newPassword === data.oldPassword) {
      issues.push({ field: 'newPassword', message: 'New password must be different from current password' });
    }
  }

  if (input?.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      issues.push({ field: 'isActive', message: 'isActive must be a boolean' });
    } else {
      data.isActive = input.isActive;
    }
  }

  if (Object.keys(data).length === 0 && Object.keys(input).length > 0) {
    issues.push({ field: 'body', message: 'At least one valid field required' });
  }

  return issues.length ? failure(issues) : success(data);
}
