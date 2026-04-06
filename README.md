# Finance Dashboard Backend

A secure, production-ready backend service for a shared financial dashboard with role-based access control, JWT authentication, and comprehensive financial record management.

## Features

- **User Authentication**: JWT-based login with HTTP-only cookie support
- **Role-Based Access Control**: Three roles (viewer, analyst, admin) with granular permissions
- **Financial Records Management**: CRUD operations with soft deletion and date-range filtering
- **Dashboard Analytics**: Summary metrics and trend analysis with interval-based grouping
- **Professional Error Handling**: Centralized validation and consistent error responses
- **Secure Design**: Parameterized queries, bcrypt password hashing, JWT token verification on every request
- **Optimized Code**: Reusable utility modules, eliminated redundancy, clean separation of concerns

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or remote)
- npm or yarn

### Installation

1. Clone and install:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

3. Initialize database:
   ```bash
   npm run db:init
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Verify health:
   ```bash
   curl http://localhost:4000/health
   ```

Server runs on `http://localhost:4000` by default.

## Development

- `npm run dev` — Start development server with auto-reload
- `npm run check` — Run validation checks
- `npm start` — Start production server
- `npm run db:init` — Initialize or reset database

## Project Structure

```
src/
├── server.js              # Express app bootstrap and middleware setup
├── config.js              # Environment configuration validation
├── routes/                # HTTP route definitions and RBAC wiring
├── controllers/           # Business logic and database orchestration
├── middleware/            # Auth, RBAC, validation, and error handling
├── security/              # JWT and bcrypt utilities
├── utils/                 # Reusable query builders and validators
├── validation/            # Request schema validation functions
└── db/                    # Connection pool, schema, and initialization
```

## API Overview

### Authentication
- **Public**: `POST /api/auth/login` — User login
- **Protected**: `GET /api/me` — Current user profile
- **Protected**: `PATCH /api/me/profile` — Update own profile

### User Management (Admin-only)
- `GET /api/users` — List all users
- `POST /api/users` — Create new user
- `PATCH /api/users/:id` — Update user

### Financial Records
- `GET /api/records` — List records with filtering and pagination
- `POST /api/records` — Create new record
- `PATCH /api/records/:id` — Update record
- `DELETE /api/records/:id` — Delete record (soft delete)

### Dashboard
- `GET /api/dashboard` — Dashboard summary (viewers can access)
- `GET /api/dashboard/insights` — Advanced analytics (analysts and admins)

See [API Reference](docs/api-reference.md) for detailed endpoint documentation.

## Authentication

All protected endpoints require a JWT token via:

```http
Authorization: Bearer <token>
```

Or the token is automatically sent as an HTTP-only cookie on login (recommended for browser clients).

Token expires in 1 hour. Verification occurs on every request.

## Roles & Permissions

| Feature | Viewer | Analyst | Admin |
|---------|--------|---------|-------|
| View Dashboard Summary | ✅ | ✅ | ✅ |
| View Dashboard Insights | ❌ | ✅ | ✅ |
| View Records | ❌ | ✅ | ✅ |
| Create/Edit Records | ❌ | ✅ | ✅ |
| Delete Records | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ |

## Documentation

- **[API Reference](docs/api-reference.md)** — Complete endpoint documentation with examples

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": { "field": "explanation" }
  }
}
```

Common status codes:
- `400` — Invalid input or malformed request
- `401` — Missing or invalid authentication
- `403` — Insufficient permissions or forbidden action
- `404` — Resource not found
- `409` — Conflict (e.g., duplicate username)
- `500` — Server error

## Security

- ✅ SQL injection protection via parameterized queries
- ✅ Password security with bcrypt hashing
- ✅ CSRF protection via HTTP-only cookies
- ✅ XSS prevention via proper JSON encoding
- ✅ Rate limiting recommended for production

## Performance

- Pagination on list endpoints (default 10, max 100 items)
- Database indexes on:
  - Username (unique, for login)
  - Role + active status (for RBAC queries)
  - Record dates (for filtering)
  - Record type and category (for grouping)
  - Soft delete flag (for WHERE clauses)

## Testing

Run `npm run check` to validate all files. For comprehensive testing:

```bash
# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"ChangeMe123!"}'

# Test dashboard
curl http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer <token>"
```

## Seeded Test Accounts

Current unchanged password for `admin1`, `analyst1`, `analyst2`, and `viewer1`: `ChangeMe123!`

| Username | Role | Email | Password |
|----------|------|-------|----------|
| admin1 | admin | admin1@finance.local | ChangeMe123! |
| analyst1 | analyst | analyst1@finance.local | ChangeMe123! |
| analyst2 | analyst | analyst2@finance.local | ChangeMe123! |
| viewer1 | viewer | viewer1@finance.local | ChangeMe123! |

**⚠️ Change these passwords in production!**

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 4000 | Server port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | Secret for signing tokens |
| `JWT_EXPIRES_IN` | 1h | Token expiration time |
| `NODE_ENV` | development | Environment mode |
