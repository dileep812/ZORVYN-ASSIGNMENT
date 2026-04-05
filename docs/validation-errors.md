# Validation & Error Handling

This document explains validation rules, error responses, and how to handle them in client code.

## Validation Rules

### User Fields

#### name
- **Required:** Yes (on create)
- **Type:** String
- **Length:** 2-120 characters
- **Error:** `"name must be 2-120 characters"`

#### email
- **Required:** Yes (on create)
- **Type:** String (email format)
- **Format:** Valid RFC 5322 email
- **Unique:** Must not exist in system
- **Error (format):** `"Invalid email format"`
- **Error (duplicate):** `"Email already in use"` (409 Conflict)

#### username
- **Required:** Yes (on create)
- **Type:** String
- **Length:** 3-30 characters
- **Format:** Alphanumeric, `-`, `_`, `.` allowed
- **Unique:** Must not exist in system
- **Error (format):** `"Username must be 3-30 characters"`
- **Error (duplicate):** `"Username already taken"` (409 Conflict)

#### password
- **Required:** Yes (on create and changes)
- **Type:** String
- **Length:** 8-72 characters
- **Complexity:** No specific requirements (bcrypt compatible)
- **Error:** `"Password must be 8-72 characters"`

#### role
- **Required:** Yes (on create)
- **Type:** String
- **Values:** `viewer`, `analyst`, `admin`
- **Error:** `"Role must be one of: viewer, analyst, admin"`

#### isActive / is_active
- **Required:** No
- **Type:** Boolean
- **Default:** `true` on creation
- **Error:** `"is_active must be boolean"`

### Record Fields

#### amount
- **Required:** Yes
- **Type:** Number (decimal)
- **Range:** > 0 (must be positive)
- **Precision:** Up to 12 digits total, 2 decimal places (e.g., 9999999.99)
- **Error:** `"amount must be a positive number"`

#### type
- **Required:** Yes
- **Type:** String
- **Values:** `income`, `expense`
- **Error:** `"type must be 'income' or 'expense'"`

#### category
- **Required:** Yes
- **Type:** String
- **Length:** 1-50 characters
- **Format:** Any string (user-provided or predefined list)
- **Error:** `"category must be 1-50 characters"`

#### record_date / date
- **Required:** Yes
- **Type:** String (date only)
- **Format:** `YYYY-MM-DD` (e.g., `2026-04-05`)
- **Constraint:** Cannot be null; must be valid date
- **Error (format):** `"Invalid date format, must be YYYY-MM-DD"`
- **Error (range):** `"startDate cannot be after endDate"` (when both provided)

#### notes
- **Required:** No
- **Type:** String
- **Length:** 0-500 characters (optional)
- **Default:** Empty string if omitted
- **Error:** `"notes must be 0-500 characters"`

### Query Parameters

#### page / limit (list endpoints)
- **page:** 1-based page number (default: 1)
- **limit:** Items per page (default: 10, max: 100)
- **Error:** `"page must be >= 1"`, `"limit must be 1-100"`

#### startDate / endDate (date filtering)
- **Format:** `YYYY-MM-DD`
- **Logic:** Records with `record_date >= startDate AND record_date <= endDate`
- **Error:** `"Invalid date format for startDate or endDate"`
- **Error:** `"startDate cannot be after endDate"` (409 Conflict)

#### type / category (filtering)
- **type:** `income` or `expense`
- **category:** Any string (partial match)
- **Logic:** Case-insensitive match

#### interval (insights endpoint)
- **Type:** String
- **Values:** `week`, `month`
- **Default:** `week`
- **Error:** Silently defaults if invalid

## HTTP Status Codes

### 200 OK
- **When:** Successful GET/PATCH
- **Response:** Resource data with status code

### 201 Created
- **When:** Successful POST (resource created)
- **Response:** Created resource data with 201 status

### 204 No Content
- **When:** Successful DELETE
- **Response:** Empty body, 204 status

### 400 Bad Request
- **When:** Invalid input, missing required fields, validation failure
- **Response:**
```json
{
  "error": {
    "message": "Field validation failed",
    "statusCode": 400,
    "details": {
      "amount": "amount must be a positive number",
      "category": "category must be 1-50 characters"
    }
  }
}
```

### 401 Unauthorized
- **When:** Missing authentication, invalid token, token expired
- **Response:**
```json
{
  "error": {
    "message": "Authentication token missing",
    "statusCode": 401
  }
}
```

**Causes:**
- Missing `Authorization` header or cookie
- Token signature invalid
- Token expired (> 1 hour old)
- User not found in database
- Token subject (user ID) invalid format

### 403 Forbidden
- **When:** Authenticated but insufficient permissions
- **Response:**
```json
{
  "error": {
    "message": "Insufficient permissions for this action",
    "statusCode": 403
  }
}
```

**Causes:**
- User role not in allowed roles (e.g., viewer trying to create record)
- Admin trying to deactivate themselves
- User account is inactive (`is_active = false`)
- Trying to reactivate own account (admin-only)

### 404 Not Found
- **When:** Resource doesn't exist
- **Response:**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

**Causes:**
- User ID doesn't exist
- Record ID doesn't exist
- Record was deleted (soft delete)

### 409 Conflict
- **When:** Duplicate data or constraint violation
- **Response:**
```json
{
  "error": {
    "message": "Email already in use",
    "statusCode": 409
  }
}
```

**Causes:**
- Email or username already exists in system
- Trying to promote user to admin when admin already exists
- Date range invalid (startDate > endDate)

### 500 Internal Server Error
- **When:** Unexpected server error
- **Response:**
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "statusCode": 500
  }
}
```

**Causes:**
- Database connection failure
- Bugs in code
- Unhandled exceptions

## Response Format

### Success Response
```json
{
  "data": { /* resource or array of resources */ }
}
```

### Success with Metadata
```json
{
  "data": [ /* array of resources */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

### Error Response
```json
{
  "error": {
    "message": "Human-readable error description",
    "statusCode": 400,
    "details": { /* optional field-level errors */ }
  }
}
```

## Common Validation Scenarios

### Creating a User with Invalid Email

**Request:**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "not-an-email",
    "username": "john",
    "password": "StrongPass123!"
  }'
```

**Response (400):**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

### Creating a Record with Duplicate Category Typo

**Request:**
```bash
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -50,
    "type": "expense",
    "category": "food",
    "date": "2026-04-05"
  }'
```

**Response (400):**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": {
      "amount": "amount must be a positive number"
    }
  }
}
```

### Accessing Protected Endpoint Without Token

**Request:**
```bash
curl http://localhost:4000/api/records
```

**Response (401):**
```json
{
  "error": {
    "message": "Authentication token missing",
    "statusCode": 401
  }
}
```

### Viewer Trying to Create Record

**Request:**
```bash
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer <viewer_token>" \
  -H "Content-Type: application/json" \
  -d '{ "amount": 50, "type": "expense", ... }'
```

**Response (403):**
```json
{
  "error": {
    "message": "Insufficient permissions for this action",
    "statusCode": 403
  }
}
```

### Duplicate Email Registration

**Request:**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Duplicate",
    "email": "existing@finance.local",
    "username": "johnnew",
    "password": "StrongPass123!"
  }'
```

**Response (409):**
```json
{
  "error": {
    "message": "Email already in use",
    "statusCode": 409
  }
}
```

### Invalid Date Range

**Request:**
```bash
curl 'http://localhost:4000/api/records?startDate=2026-12-31&endDate=2026-01-01' \
  -H "Authorization: Bearer <token>"
```

**Response (400):**
```json
{
  "error": {
    "message": "startDate cannot be after endDate",
    "statusCode": 400
  }
}
```

## Security Considerations

### Input Validation

- All inputs validated before database query
- Unknown fields in request are ignored (not passed to DB)
- XSS prevention: All values stored as-is, output as JSON (no HTML injection)
- SQL injection: Impossible via parameterized queries

### Error Messages

- **Deliberate ambiguity:** Login errors don't distinguish between invalid username vs. invalid password (prevents account enumeration)
- **Sensitive data masked:** Passwords, hashes never appear in responses
- **Stack traces:** Not exposed to clients; only logged server-side

### Rate Limiting

Not currently implemented. For production, add:
- Login attempts: ~5 per minute per IP
- API requests: ~100 per minute per authenticated user
- Record creation: ~10 per minute per user

## Troubleshooting

### "Invalid token"

**Cause:** Token expired or signature corrupted

**Fix:** Re-login to get new token

### "startDate cannot be after endDate"

**Cause:** Reversed date order in query

**Fix:** Ensure `startDate <= endDate`

### "Username already taken"

**Cause:** Username exists in system

**Fix:** Choose different username or update existing user

### "Only one admin account is allowed"

**Cause:** Trying to create second admin

**Fix:** Cannot have multiple admins; convert existing admin to analyst or change role of new user to analyst

## Response Headers

All responses include:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `application/json` | Response format |
| `X-User-Role` | `admin` \| `analyst` \| `viewer` | Current user role (if authenticated) |

## Testing Validation

Use curl or Postman:

```bash
# Test valid request
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "type": "expense", "category": "food", "date": "2026-04-05"}'

# Test invalid amount (negative)
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": -50, "type": "expense", "category": "food", "date": "2026-04-05"}'

# Test invalid date format
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "type": "expense", "category": "food", "date": "04-05-2026"}'
```
