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

### Change Own Password

`PATCH /api/me/password`

Request:

```json
{
  "currentPassword": "ChangeMe123!",
  "newPassword": "MyNewStrongPass123!",
  "confirmPassword": "MyNewStrongPass123!"
}
```

Response:

```json
{ "message": "Password updated successfully" }
```

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

Request examples:

```json
{ "isActive": false }
```

```json
{ "password": "NewStrongPass123!" }
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
      "version": 1,
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
    "version": 1,
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
  "amount": 1100,
  "version": 1
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
    "version": 2,
    "created_at": "2026-04-01T12:00:00.000Z",
    "updated_at": "2026-04-01T12:05:00.000Z"
  }
}
```

Possible errors:

- `400` invalid record id/body
- `409` stale version or concurrent update

#### Delete record

`DELETE /api/records/:id`

Response:

- `204 No Content`

### Dashboard

`GET /api/dashboard/dashboard?startDate=2026-01-01&endDate=2026-12-31`

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

## Common Error Format

```json
{
  "message": "Invalid request body",
  "details": [
    { "field": "username", "message": "Username is required and must be valid" }
  ]
}
```
