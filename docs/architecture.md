# Architecture

## Overview

The backend follows a layered architecture pattern with clear separation of concerns:

```
HTTP Request
    ↓
Routes (express routing + RBAC)
    ↓
Middleware (auth, validation, error handling)
    ↓
Controllers (business logic)
    ↓
Utilities (queries, validation, security)
    ↓
Database (PostgreSQL)
```

## Folder Structure & Purpose

### `src/server.js`

**Responsibility:** Application bootstrap and middleware registration

**Contains:**
- Express app instantiation
- Middleware setup (CORS, helmet, morgan, cookie-parser, JSON parsing)
- Global error handler registration
- Route mounting

**Key Pattern:** Middleware is registered in order; critical middleware (auth, validation) runs before route handlers.

### `src/config.js`

**Responsibility:** Environment configuration loading and validation

**Contains:**
- Reads `.env` file via dotenv
- Validates required variables (PORT, DATABASE_URL, JWT_SECRET)
- Exports configuration object for app startup

**Key Pattern:** Fails fast on startup if required config is missing (prevents runtime errors).

### `src/routes/`

**Responsibility:** HTTP endpoint definitions and route-level access control

**Files:**
- `auth.routes.js` — Login, logout, profile endpoints
- `user.routes.js` — User CRUD (admin-only)
- `record.routes.js` — Record CRUD (analyst+)
- `dashboard.routes.js` — Dashboard and insights endpoints

**Key Pattern:**
```javascript
router.use(isToken);          // Auth middleware
router.use(requireRole(['analyst', 'admin'])); // RBAC
router.get('/', controller);  // Handler
```

Route handlers delegate all logic to controllers; routes are thin.

### `src/controllers/`

**Responsibility:** Business logic and database orchestration

**Files:**
- `auth.controller.js` — Login/logout/profile logic
- `user.controller.js` — User CRUD operations
- `record.controller.js` — Record CRUD operations
- `dashboard.controller.js` — Dashboard summary and insights

**Pattern:**
```javascript
export async function myHandler(req, res, next) {
  try {
    // Validate input
    validateInput(req.body);
    
    // Call utility/query functions
    const result = await queryFunction(data);
    
    // Return response
    res.json({ data: result });
  } catch (error) {
    next(error);  // Pass to error handler
  }
}
```

All controllers:
- Use try/catch for error handling
- Pass errors to `next(error)` (handled by error middleware)
- Import utilities instead of direct database access
- Return consistent JSON responses

### `src/middleware/`

**Responsibility:** Cross-cutting concerns (auth, validation, error handling)

**Files:**

#### `auth.middleware.js` — `isToken()`
- Extracts JWT from cookie or Authorization header
- Verifies token signature and expiration
- Loads user data and checks `is_active` status
- Attaches `req.user` and `req.userRole` for downstream handlers
- Returns 401 if token missing/invalid; 403 if user inactive

#### `rbac.middleware.js` — `requireRole(roles)`
- Higher-order middleware factory
- Checks if `req.userRole` is in allowed roles
- Returns 403 if user lacks permission
- Usage: `router.use(requireRole(['admin']))`

#### `validate.middleware.js` — `validateSchema(schema)`
- Higher-order middleware factory
- Validates request body/query against provided schema
- Attaches `req.validatedBody` or `req.validatedQuery`
- Returns 400 with field-level errors if validation fails

#### `error.middleware.js` — Global error handler
- Catches all errors passed via `next(error)`
- Formats response consistently (status, message, details)
- Logs errors to console
- Returns 500 for unexpected errors; specific codes for known errors

### `src/security/`

**Responsibility:** Cryptographic operations and token management

**File:** `auth.security.js`

**Exports:**
- `hashPassword(plaintext)` — Hash password with bcrypt
- `verifyPassword(plaintext, hash)` — Compare password to hash
- `createAccessToken(user)` — Sign JWT token
- `verifyAccessToken(token)` — Verify and decode JWT

**Key Pattern:** Encapsulates all crypto; controllers never do password hashing directly.

### `src/utils/`

**Responsibility:** Reusable query builders, validators, and utilities

**Files:**

#### `user.queries.js` — User database operations
- `getUserById(userId, columns)` — Get user by ID
- `getUserByUsername(username)` — Lookup user for login
- `checkUsernameUnique(username, excludeUserId)` — Validate username
- `checkEmailUnique(email, excludeUserId)` — Validate email
- `getAdminUser()` — Check if admin exists
- `getAllUsers()` — List all users

#### `db.queries.js` — Generic database helpers
- `buildUpdateQuery(updates, id, table)` — Build dynamic UPDATE SQL
- `executeUpdate(updates, id, table)` — Execute UPDATE
- `executeInsert(fields, values, table, returningCols)` — Generic INSERT
- `createNewUser(userData)` — Create user
- `createNewRecord(recordData)` — Create record
- `getRecordById(recordId)` — Get record
- `listRecords(startDate, endDate, offset, limit)` — List with pagination
- `getDashboardSummary(period)` — Get trends

#### `validation.utils.js` — Input validation helpers
- `validateUserId(userId)` — ID format check
- `validateRecordId(recordId)` — ID format check
- `validateDateRange(startDate, endDate)` — Date comparison
- `validateEmail(email)` — Email format
- `validateUsername(username)` — Username requirements
- `validatePassword(password)` — Password requirements
- `validateRole(role)` — Role enum check
- `validatePositiveNumber(value, fieldName)` — Positive number check

#### `admin.utils.js` — Admin business logic
- `canDeactivateUser(targetUserId, currentUserId, currentUserRole)` — Deactivation permissions
- `canReactivateUser(currentUserRole)` — Reactivation permissions
- `verifyAdminExists()` — Check admin exists
- `isAdminUser(userId)` — Is user an admin
- `verifyNotAdmin(userId)` — Is user not admin
- `checkAdminLimit()` — Admin limit checks

#### `error.utils.js` — Error creation helper
- `createError(message, statusCode, details)` — Standardized error factory

**Key Pattern:** Utilities are pure functions with no side effects (except database access). All controllers import utilities; duplicate code is eliminated.

### `src/validation/`

**Responsibility:** Request schema definitions

**File:** `schemas.validation.js`

**Contains:** Schema objects passed to validation middleware:
```javascript
export const createUserSchema = {
  name: { required: true, type: 'string', minLength: 2 },
  email: { required: true, type: 'email' },
  username: { required: true, type: 'string', minLength: 3 },
  // ...
}
```

Each schema defines required fields, types, and constraints. Used by `validateSchema()` middleware.

### `src/db/`

**Responsibility:** Database connection, schema, and initialization

**Files:**

#### `connection.db.js`
- Creates and exports PostgreSQL connection pool
- Configuration: 10-20 concurrent connections
- Lazy initialization until first use

#### `schema.sql`
- SQL DDL for all tables (users, financial_records)
- Indexes for:
  - `username` (unique, for login lookup)
  - `role, is_active` (for RBAC filtering)
  - `record_date` (for date range queries)
  - `type, category` (for grouping)
  - `is_deleted` (for soft delete filtering)
  - `created_by` (for user-based queries)

#### `init.db.js`
- Execution script: `npm run db:init`
- Creates database if missing
- Runs schema.sql to create tables/indexes
- Runs `seed.sql` to insert test accounts

#### `seed.sql`
- Inserts 5 test users (admin1, analyst1, viewer1, etc.)
- Default password hash: `ChangeMe123!` hashed with bcrypt
- Used for local development and testing

## Request Flow Example

```
1. POST /api/records — User creates financial record

2. Router → validates: requireRole(['analyst', 'admin'])
   ✓ User is analyst → passes

3. Middleware → validateSchema(createRecordSchema)
   ✓ amount, type, category valid → req.validatedBody set

4. Controller → createRecord(req, res, next)
   try {
     validatePositiveNumber(amount) ✓
     validateDateRange(...) ✓
     createNewRecord(data) → INSERT into DB
     res.json({ data: result })
   }

5. Error Middleware → (if error occurred)
   Formats error → returns { error: { message, statusCode, details } }

6. Response → 201 Created with record data
```

## Data Flow Patterns

### Happy Path

```
Request Data
    ↓
Validation (middleware + utilities)
    ↓
Query Execution (utilities)
    ↓
Response JSON
    ↓
Client
```

### Error Path

```
Error thrown
    ↓
Try/catch → next(error)
    ↓
Error Middleware
    ↓
Format Response
    ↓
Client receives error
```

## Code Reusability

**Query Builders:**
- `buildUpdateQuery()` used by user, auth, record controllers
- `executeInsert()` used for user and record creation
- Date validation used by record and dashboard controllers

**Result:** ~170 lines of duplicate code eliminated through extraction into utilities.

## Performance Optimizations

1. **Connection Pooling:** Reuses database connections (default 10)
2. **Indexes:** Critical queries indexed (username, role, dates)
3. **Pagination:** List endpoints default to 10 items, max 100
4. **Soft Delete:** Single `is_deleted` flag rather than cascading deletes
5. **Parallel Queries:** Dashboard uses `Promise.all()` for concurrent queries
6. **Middleware Ordering:** Fast middleware (validation) before slow (auth)

## Extension Points

### Adding a New Endpoint

1. Create handler in `controllers/newThing.controller.js`
2. Add schema in `validation/schemas.validation.js`
3. Create route in `routes/newThing.routes.js`
4. Mount in `server.js`: `app.use('/api/newThing', newThingRoutes)`
5. Add utilities to `utils/` if query reuse likely

### Adding a New Security Feature

1. Implement middleware in `middleware/newFeature.middleware.js`
2. Register in `server.js` before routes
3. Document in [Authentication](authentication.md)

### Adding a Database Table

1. Add DDL to `src/db/schema.sql`
2. Create query helpers in `src/utils/*.queries.js`
3. Create controller and routes
4. Document in [Data Model](data-model.md)

## Error Handling Strategy

**Errors are centralized:**
1. Controllers throw `createError(message, code, details)` from `error.utils.js`
2. Middleware catches via `next(error)`
3. Error middleware formats and responds

**Benefits:**
- Consistent error format across API
- Centralized logging
- Easy to add monitoring/alerting

## Security Architecture

1. **Authentication:** JWT via cookie or header, verified on every protected request
2. **Authorization:** Role-based middleware `requireRole()` checks permissions
3. **Input Validation:** All inputs validated before business logic
4. **SQL Injection:** Parameterized queries (all database access via utilities)
5. **Password Security:** bcrypt hashing with salt
6. **CSRF:** HTTP-only cookies with SameSite policy

## Database Design

**Normalized schema** with:
- Primary keys (id)
- Unique constraints (username)
- Foreign keys (created_by → users.id)
- Soft delete flag (is_deleted)
- Audit timestamps (created_at, updated_at)

**Indexes** on frequently queried columns ensure O(log N) lookup times.

## Deployment Architecture

```
Load Balancer
    ↓
[Node.js Instance 1] ─┐
[Node.js Instance 2] ─┼→ Connection Pool → PostgreSQL
[Node.js Instance 3] ─┘
    ↓
Error Monitoring (Sentry, etc.)
    ↓
Log Aggregation (ELK, DataDog, etc.)
```

For production scaling:
- Multiple Node instances behind load balancer
- Sticky sessions for stateless design
- Shared PostgreSQL pool across instances
- Centralized logging and error tracking

## Summary

- **Layered Architecture:** Routes → Controllers → Utilities → Database
- **Separation of Concerns:** Each layer has single responsibility
- **DRY Principle:** Utilities eliminate redundancy
- **Error Handling:** Centralized via middleware
- **Security:** Multiple layers (auth, validation, parameterization)
- **Performance:** Indexes, pooling, pagination, parallel queries
