# Setup Guide

Complete instructions for setting up the Finance Dashboard Backend.

## Prerequisites

- **Node.js** 20 or higher (download from [nodejs.org](https://nodejs.org))
- **PostgreSQL** 12+ (local or remote instance)
- **npm** (included with Node.js)

Verify installations:

```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show PostgreSQL version
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/finance_dashboard

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# Cookies (optional)
COOKIE_SECURE=false        # Set true in production with HTTPS
COOKIE_SAME_SITE=lax       # or 'strict' for production
COOKIE_DOMAIN=              # Leave empty for localhost
```

**Important Security Notes:**
- Generate a strong `JWT_SECRET` in production (use `openssl rand -base64 32`)
- Never commit `.env` to version control
- Change all default values in production

### 3. Initialize the Database

Ensure PostgreSQL is running, then:

```bash
npm run db:init
```

This command:
- Creates the database if it doesn't exist
- Creates tables (users, financial_records)
- Creates indexes for performance
- Seeds test accounts with default password `ChangeMe123!`

**Database Structure:**

- `users` table: id, name, email, username, password_hash, role, is_active, created_at, updated_at
- `financial_records` table: id, amount, type, category, record_date, notes, created_by, is_deleted, created_at, updated_at

### 4. Start the Development Server

```bash
npm run dev
```

Output:
```
Server listening on http://localhost:4000
```

Verify it's running:

```bash
curl http://localhost:4000/health
# Response: {"status":"ok"}
```

## Testing the Setup

### 1. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "ChangeMe123!"
  }'
```

Response includes JWT token.

### 2. Access Protected Endpoint

```bash
curl http://localhost:4000/api/me \
  -H "Authorization: Bearer <token-from-login>"
```

### 3. Check Dashboard

```bash
curl http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer <token-from-login>"
```

## Running in Production

### Build & Start

```bash
npm start
```

This mode:
- Does not use auto-reload
- Assumes production environment variables
- Uses connection pooling
- Logs errors but not debug info

### Production Checklist

- [ ] `NODE_ENV=production` in `.env`
- [ ] Strong `JWT_SECRET` generated
- [ ] `COOKIE_SECURE=true` (requires HTTPS)
- [ ] Database backed up
- [ ] Error logging configured
- [ ] CORS origin configured
- [ ] Rate limiting enabled
- [ ] HTTPS certificate installed

## Validation & Checking

Validate code quality and syntax:

```bash
npm run check
```

This runs linting and syntax checks on all source files.

## Troubleshooting

### Cannot connect to database

**Error:** `Error: connect ECONNREFUSED`

**Fixes:**
1. Verify PostgreSQL is running: `psql --version`
2. Check DATABASE_URL in `.env` is correct
3. Ensure database exists or run `npm run db:init`
4. Verify port 5432 is open

### Port 4000 already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::4000`

**Fixes:**
1. Change PORT in `.env` to an available port (e.g., 4001)
2. Kill process using port 4000: `lsof -ti:4000 | xargs kill -9`
3. Restart server

### JWT_SECRET not configured

**Error:** `Error: JWT_SECRET is required in.env`

**Fix:**
```bash
# Generate a strong secret
openssl rand -base64 32
# Add to .env file as JWT_SECRET value
```

### Tests fail with password errors

**Error:** `Invalid username or password` on login

**Fixes:**
1. Database was not initialized: Run `npm run db:init`
2. Test account was modified: Reset with `npm run db:init` again
3. Check seeded password is `ChangeMe123!` (default)

## Development Workflow

1. **Start dev server** with auto-reload:
   ```bash
   npm run dev
   ```

2. **Make code changes** — server auto-reloads

3. **Test with curl** or Postman:
   ```bash
   curl http://localhost:4000/api/dashboard \
     -H "Authorization: Bearer <token>"
   ```

4. **Check for errors**:
   ```bash
   npm run check
   ```

5. **Review logs** in terminal for request/response details

## Environment Variables Reference

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://user:pass@localhost:5432/db` | PostgreSQL connection |
| `JWT_SECRET` | `your-secret-key` | Token signing key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `JWT_EXPIRES_IN` | 1h | Token expiration |
| `COOKIE_SECURE` | false | HTTPS-only cookies |
| `COOKIE_SAME_SITE` | lax | CSRF protection |
| `COOKIE_DOMAIN` | undefined | Cookie domain |

## Next Steps

- Read [API Reference](api-reference.md) for endpoint documentation
- Check [Authentication](authentication.md) for token management
- Review [Data Model](data-model.md) for schema details
- See [Assumptions & Tradeoffs](assumptions-tradeoffs.md) for design decisions
