# API Reference

Base URL: `http://localhost:4000`

Protected routes require:

`Authorization: Bearer <token>`

## Public Endpoints

### Health

`GET /health`

Request:

```http
GET /health
```

Response:

```json
{ "status": "ok" }
```

### Login

`POST /api/auth/login`

Request:

```json
{ "username": "admin1", "password": "ChangeMe123!" }
```

Response:

```json
{
  "data": {
    "token": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": "1h",
    "user": {
      "id": 1,
      "name": "Admin One",
      "email": "admin1@finance.local",
      "username": "admin1",
      "role": "admin",
      "isActive": true
    }
  }
}
```

Possible errors:

- `400` invalid body
- `401` invalid credentials
- `403` inactive account

## Protected Endpoints

### Current User

`GET /api/me`

Request:

```http
GET /api/me
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "id": 1,
    "name": "Admin One",
    "email": "admin1@finance.local",
    "username": "admin1",
    "role": "admin",
    "is_active": true
  }
}
```

### Update Own Profile

`PATCH /api/me/profile`

Allows authenticated users to update their profile. Users can modify:
- `name` — Display name (2-120 characters)
- `username` — Username must be unique (3-30 chars, alphanumeric with `-`, `_`, `.`)
- `newPassword` — New password (8-72 characters). **Requires `oldPassword` for verification.**
- `oldPassword` — Old/current password (required when changing password for security verification)
- `isActive` — User's active status with restrictions:
  - Users can deactivate themselves (set `isActive: false`)
  - Users cannot reactivate themselves (cannot set `isActive: true` if currently false)
  - Reactivation requires admin action

**Important restrictions:**
- Role cannot be changed by users (admin-only)
- Username must be unique across the system
- Password changes require current password verification
- All fields are optional; omit to skip updating

Request examples:

```json
{
  "name": "John Doe Updated"
}
```

```json
{
  "username": "john.doe"
}
```

```json
{
  "newPassword": "NewStrongPassword123!",
  "oldPassword": "OldPassword123!"
}\n```

```json
{
  "isActive": false
}
```

Response:

```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "admin1@finance.local",
    "username": "john.doe",
    "role": "admin",
    "isActive": false
  }
}
```

Possible errors:
- `400` invalid fields or format
- `401` authentication required or incorrect current password
- `409` username already taken
- `403` attempting to reactivate account (admin-only)

### Users

#### List users

`GET /api/users`

Response:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Admin One",
      "email": "admin1@finance.local",
      "username": "admin1",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-04-05T10:00:00.000Z"
    }
  ]
}
```

#### Create user

`POST /api/users`

Request:

```json
{
  "name": "Analyst Three",
  "email": "analyst3@finance.local",
  "username": "analyst3",
  "password": "StrongPass123!",
  "role": "analyst",
  "isActive": true
}
```

Response:

```json
{
  "data": {
    "id": 6,
    "name": "Analyst Three",
    "email": "analyst3@finance.local",
    "username": "analyst3",
    "role": "analyst",
    "is_active": true,
    "created_at": "2026-04-05T10:10:00.000Z"
  }
}
```

#### Update user

`PATCH /api/users/:id`

Admin-only endpoint. Allows updating user attributes: name, email, username, password, role, and isActive.

**Email uniqueness:** New email must not already exist in the system.

Request examples:

```json
{ "isActive": false }
```

```json
{ "email": "newemail@finance.local" }
```

```json
{ "password": "NewStrongPass123!" }
```

```json
{ "name": "Updated Name", "role": "analyst" }
```

Response:

```json
{
  "data": {
    "id": 6,
    "name": "Analyst Three",
    "email": "analyst3@finance.local",
    "username": "analyst3",
    "role": "analyst",
    "is_active": true,
    "updated_at": "2026-04-05T10:15:00.000Z"
  }
}
```

Possible errors:
- `400` invalid fields or format
- `403` insufficient permissions (admin-only)
- `404` user not found
- `409` email already in use or admin-only restrictions violated

### Records

#### List records

`GET /api/records?type=expense&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=20`

Response:

```json
{
  "data": [
    {
      "id": 10,
      "amount": "250.00",
      "type": "expense",
      "category": "food",
      "record_date": "2026-04-01",
      "notes": "team lunch",
      "created_by": 1,
      "created_at": "2026-04-01T12:00:00.000Z",
      "updated_at": "2026-04-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### Create record

`POST /api/records`

Request:

```json
{
  "amount": 1000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "notes": "monthly salary"
}
```

Response:

```json
{
  "data": {
    "id": 20,
    "amount": "1000.00",
    "type": "income",
    "category": "salary",
    "record_date": "2026-04-01",
    "notes": "monthly salary",
    "created_by": 1,
    "created_at": "2026-04-01T12:00:00.000Z",
    "updated_at": "2026-04-01T12:00:00.000Z"
  }
}
```

#### Update record

`PATCH /api/records/:id`

Request:

```json
{
  "amount": 1100
}
```

Response:

```json
{
  "data": {
    "id": 20,
    "amount": "1100.00",
    "type": "income",
    "category": "salary",
    "record_date": "2026-04-01",
    "notes": "monthly salary",
    "created_by": 1,
    "created_at": "2026-04-01T12:00:00.000Z",
    "updated_at": "2026-04-01T12:05:00.000Z"
  }
}
```

Possible errors:

- `400` invalid record id/body
- `404` record not found

#### Delete record

`DELETE /api/records/:id`

Response:

- `204 No Content`

### Dashboard

`GET /api/dashboard?startDate=2026-01-01&endDate=2026-12-31`

Response:

```json
{
  "data": {
    "summary": {
      "totalIncome": 12000,
      "totalExpenses": 4500,
      "netBalance": 7500
    },
    "categoryTotals": [
      { "category": "salary", "total": "10000.00" },
      { "category": "food", "total": "1200.00" }
    ],
    "recentActivity": [],
    "monthlyTrend": [
      { "month": "2026-01", "income": "2000.00", "expense": "900.00" }
    ]
  }
}
```

#### Dashboard insights (analyst/admin)

`GET /api/dashboard/insights?startDate=2026-01-01&endDate=2026-12-31&interval=month`

Response:

```json
{
  "data": {
    "filters": {
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "interval": "month"
    },
    "metrics": {
      "totalIncome": 12000,
      "totalExpenses": 4500,
      "netBalance": 7500,
      "recordsCount": 42,
      "periodsCount": 12,
      "averageIncomePerPeriod": 1000,
      "averageExpensePerPeriod": 375,
      "savingsRate": 62.5,
      "expenseToIncomeRatio": 0.375
    },
    "trend": [
      {
        "period": "2026-01",
        "income": "2000.00",
        "expense": "900.00",
        "net": 1100
      }
    ],
    "topExpenseCategories": [
      { "category": "food", "totalExpense": "1200.00" }
    ],
    "topIncomeCategories": [
      { "category": "salary", "totalIncome": "10000.00" }
    ]
  }
}
```

Possible errors:

- `400` invalid query parameters
- `401` missing/invalid token
- `403` role is not analyst/admin

## Common Error Format

```json
{
  "message": "Invalid request body",
  "details": [
    { "field": "username", "message": "Username is required and must be valid" }
  ]
}
```
