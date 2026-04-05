# Project Overview

## What is This?

A secure, production-ready backend API for a shared financial dashboard. Multiple team members access a centralized system to view, create, and analyze financial records with role-based restrictions.

## Use Case

A team of 5-50 people needs to:
- Log in securely
- View financial summaries (dashboard)
- Create and manage expense/income records
- Analyze trends by category, date, or type
- Manage user accounts and permissions

This backend serves all these needs via a RESTful API.

## Key Features

### 1. User Authentication & Authorization

- **JWT-based login** with automatic token expiration every hour
- **HTTP-only cookies** (CSRF-safe for browsers)
- **Bearer token support** (for mobile/API clients)
- **Three roles** with granular access:
  - **Viewer:** Dashboard summary only
  - **Analyst:** Dashboard + records CRUD + insights
  - **Admin:** Full access including user management

### 2. Financial Record Management

- Create, read, update, and soft-delete records
- Filter by date range, type (income/expense), category
- Pagination with configurable page size
- Preserves deleted records for audit trail
- Track who created each record and when

### 3. Dashboard & Analytics

- **Summary view:** Total income, expenses, net balance, category breakdown
- **Insights view:** Period-based trends (weekly/monthly), top categories, savings rate
- Aggregate data from all records (or date-filtered subset)
- Fast parallel queries for performance

### 4. User Management

- Create, list, and update users
- Role assignment (viewer, analyst, admin)
- Account activation/deactivation
- Password management and hashing
- Email and username uniqueness enforcement

### 5. Security by Design

- Parameterized SQL queries (prevents SQL injection)
- bcrypt password hashing with automatic salt
- JWT token verification on every request
- CORS and CSRF protection
- Active/inactive account status enforcement
- Role-based access control on all endpoints

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js (v20+) | JavaScript runtime |
| Framework | Express.js | HTTP server and routing |
| Database | PostgreSQL | Relational data persistence |
| Authentication | jsonwebtoken | JWT signing and verification |
| Security | bcryptjs | Password hashing |
| HTTP | helmet | Security headers |
| Logging | Morgan | Request logging |

## Architecture

```
┌─────────────────────────────────────────────────┐
│ HTTP Client (Browser, Mobile, API)              │
└──────────────┬──────────────────────────────────┘
               │ HTTP Request
               ▼
┌─────────────────────────────────────────────────┐
│ Express Server (src/server.js)                  │
│ ├─ Middleware: Auth, Validation, Error Handler │
│ └─ Routes: /api/auth, /api/users, /api/records │
└──────────────┬──────────────────────────────────┘
               │ Processed Request
               ▼
┌─────────────────────────────────────────────────┐
│ Controllers (Business Logic)                    │
│ ├─ auth.controller.js                           │
│ ├─ user.controller.js                           │
│ ├─ record.controller.js                         │
│ └─ dashboard.controller.js                      │
└──────────────┬──────────────────────────────────┘
               │ SQL Query
               ▼
┌─────────────────────────────────────────────────┐
│ Utilities (Query & Validation Helpers)          │
│ ├─ src/utils/db.queries.js                      │
│ ├─ src/utils/user.queries.js                    │
│ ├─ src/utils/validation.utils.js                │
│ └─ src/utils/admin.utils.js                     │
└──────────────┬──────────────────────────────────┘
               │ Parameterized Query
               ▼
┌─────────────────────────────────────────────────┐
│ PostgreSQL Database                             │
│ ├─ users (authentication & roles)               │
│ └─ financial_records (income/expenses)          │
└─────────────────────────────────────────────────┘
```

**Key principle:** Each layer has a single responsibility; requests flow downward, responses flow upward.

## Data Model

### Users Table

```
id (primary key)
name (display name)
email (unique)
username (unique, for login)
password_hash (bcrypt-hashed)
role (viewer | analyst | admin)
is_active (boolean, for soft disable)
created_at (ISO timestamp)
updated_at (ISO timestamp)
```

### Financial Records Table

```
id (primary key)
amount (decimal, must be > 0)
type (income | expense)
category (string, user-provided or predefined list)
record_date (YYYY-MM-DD format)
notes (optional description)
created_by (foreign key to users.id)
is_deleted (soft delete flag)
created_at (ISO timestamp)
updated_at (ISO timestamp)
```

## API Endpoints

### Public (No Auth Required)
- `POST /api/auth/login` — User login
- `GET /health` — Health check

### User Profile (Auth Required)
- `GET /api/me` — Current user
- `PATCH /api/me/profile` — Update own profile

### User Management (Admin Only)
- `GET /api/users` — List all users
- `POST /api/users` — Create user
- `PATCH /api/users/:id` — Update user

### Records (Analyst+)
- `GET /api/records` — List records with filtering by date, category, and type plus pagination
- `POST /api/records` — Create record
- `PATCH /api/records/:id` — Update record
- `DELETE /api/records/:id` — Delete record

### Dashboard (Viewer+)
- `GET /api/dashboard` — Summary view
- `GET /api/dashboard/insights` — Analytics (Analyst+ only)

For detailed endpoint documentation, see [API Reference](api-reference.md).

## Quick Start Example

**1. Login**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst1",
    "password": "ChangeMe123!"
  }'
```

**Response includes JWT token.**

**2. Create a record**
```bash
curl -X POST http://localhost:4000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45.50,
    "type": "expense",
    "category": "food",
    "date": "2026-04-05",
    "notes": "Lunch meeting"
  }'
```

**3. View dashboard**
```bash
curl http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer <token>"
```

## Role Comparison

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Insights | ❌ | ✅ | ✅ |
| Create Record | ❌ | ✅ | ✅ |
| Edit Record | ❌ | ✅ | ✅ |
| Delete Record | ❌ | ✅ | ✅ |
| Create User | ❌ | ❌ | ✅ |
| Edit User | ❌ | ❌ | ✅ |
| Delete User | ❌ | ❌ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ |

## Performance Characteristics

| Operation | Typical Time | Notes |
|-----------|------|-------|
| Login | 100-200ms | bcrypt password verification |
| List Records (1000 items) | 50-100ms | Indexed database query |
| Create Record | 20-50ms | Write + index update |
| Dashboard Summary | 30-80ms | Multiple parallel queries |
| Dashboard Insights | 50-150ms | Aggregate + grouping |

- Database queries use indexes for O(log N) lookup
- Connection pooling reduces network overhead
- Pagination limits result size

## Design Decisions

### Why JWT (Not Session-Based)?

- Stateless (easier to scale)
- Work with mobile/API clients
- No server-side session storage

### Why Soft Delete (Not Hard Delete)?

- Preserves audit trail
- Enables accidental deletion recovery
- Better compliance/compliance auditing

### Why Manual Validation (Not ORM)?

- Explicit control over errors and messages
- Minimal dependencies
- Easier to debug and test

### Why Role-Based (Not Attribute-Based)?

- Simpler to implement and understand
- Three roles cover most team structures
- Can migrate to attributes if needed later

For more detailed reasoning, see [Assumptions & Tradeoffs](assumptions-tradeoffs.md).

## Getting Started

1. **Setup:** Follow [Setup Guide](setup.md)
2. **Learn API:** Read [API Reference](docs/api-reference.md)
3. **Understand Auth:** See [Authentication](authentication.md)
4. **Explore Code:** Review [Architecture](architecture.md)

## Support & Debugging

See [Validation & Errors](validation-errors.md) for:
- HTTP status codes and their meanings
- Common validation errors and fixes
- Error response format

See [Setup Guide](setup.md) for troubleshooting:
- Database connection issues
- Port already in use
- Password verification failures

## Next Steps

- Deploy to production (see [Setup Guide](setup.md) production section)
- Integrate with frontend application
- Set up monitoring and error tracking
- Configure automated backups
