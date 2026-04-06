# API Reference

Base URL: `http://localhost:4000`

Default admin credentials (seed data):

- `username`: `admin1`
- `password`: `ChangeMe123!`

Important: change default credentials after first login.

Authentication options for protected endpoints:

- `Authorization: Bearer <token>`
- HTTP-only auth cookie set by login (`access_token` by default)

## Public Endpoints

### Health

`GET /health`

Authorization: `Public`

Rate limit: This endpoint is rate-limited (`60` requests per `1` minute per IP).

Response:

```json
{
  "status": "ok",
  "environment": "development",
  "uptimeSeconds": 1234
}
```

### Login

`POST /api/auth/login`

Authorization: `Public`

Rate limit: This endpoint is rate-limited (`10` attempts per `15` minutes per IP).

Request:

```json
{ "username": "admin1", "password": "ChangeMe123!" }
```

Response:

```json
{
  "data": {
    "authenticated": true,
    "token": "<jwt>",
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

Note: JWT is both returned in response (`data.token`) and set in an HTTP-only cookie.

Possible errors:

- `400` invalid request body
- `401` invalid username/password
- `429` too many login attempts

## Protected Endpoints

### Logout

`POST /api/auth/logout`

Authorization: `Any authenticated user (viewer/analyst/admin)`

Notes:

- Works even if account is currently inactive (valid token/cookie required).

Response:

```json
{ "message": "Logged out successfully" }
```

### Current User

`GET /api/me`

Authorization: `Any active authenticated user (viewer/analyst/admin)`

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

Authorization: `Any active authenticated user (viewer/analyst/admin)`

Allowed fields:

- `name`
- `username` (must be unique)
- `newPassword` (requires `oldPassword`)
- `oldPassword`
- `isActive`

Notes:

- Users can deactivate themselves (`isActive: false`).
- Users cannot reactivate themselves (`isActive: true` when inactive is blocked).

Possible errors:

- `400` invalid request body
- `401` authentication required / wrong old password
- `403` forbidden status transition
- `409` username conflict

### List Users

`GET /api/users`

Authorization: `Admin only`

### Create User

`POST /api/users`

Authorization: `Admin only`

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

### Update User

`PATCH /api/users/:id`

Authorization: `Admin only`

Allowed fields:

- `name`
- `email` (must be unique)
- `username` (must be unique)
- `role`
- `isActive`

Not allowed:

- `password` cannot be changed by admin in this endpoint.

Possible errors:

- `400` invalid request body
- `404` user not found
- `409` username/email conflict or admin-role restriction

### List Records

`GET /api/records?type=expense&category=food&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=20`

Authorization: `Analyst or Admin`

Supported filters:

- `type`: `income` | `expense`
- `category`: string
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `page`: integer >= 1
- `limit`: integer 1..100

### Create Record(s)

`POST /api/records`

Authorization: `Admin only`

Behavior:

- If request body is a single record object, one record is created.
- If request body is an array of record objects, multiple records are created in one request.
- Array size limit: up to `100` records per request.

Single record request:

```json
{
  "amount": 1000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "notes": "monthly salary"
}
```

Bulk request:

```json
[
  {
    "amount": 1000,
    "type": "income",
    "category": "salary",
    "date": "2026-04-01",
    "notes": "monthly salary"
  },
  {
    "amount": 250,
    "type": "expense",
    "category": "food",
    "date": "2026-04-02",
    "notes": "team lunch"
  }
]
```

Single record response:

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

Bulk response:

```json
{
  "data": [
    {
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
  ],
  "meta": {
    "created": 1
  }
}
```

### Update Record

`PATCH /api/records/:id`

Authorization: `Admin only`

Request (any subset of fields):

```json
{
  "amount": 1100,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "notes": "updated note"
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
    "notes": "updated note",
    "created_by": 1,
    "created_at": "2026-04-01T12:00:00.000Z",
    "updated_at": "2026-04-01T12:05:00.000Z"
  }
}
```

Possible errors:

- `400` invalid record id or request body
- `401` missing/invalid authentication
- `403` insufficient permissions
- `404` record not found

### Delete Record

`DELETE /api/records/:id`

Authorization: `Admin only`

Purpose:

- Soft deletes a financial record by setting `is_deleted = true`.
- The record is hidden from listing endpoints after deletion.

Path parameter:

- `id` (required): positive integer record ID

Example request:

```http
DELETE /api/records/20
Authorization: Bearer <token>
```

Response:

- `204 No Content`

Response body:

- No response body is returned on success.

Possible errors:

- `400` invalid record id
- `401` missing/invalid authentication
- `403` insufficient permissions
- `404` record not found

### Dashboard Summary

`GET /api/dashboard?startDate=2026-01-01&endDate=2026-12-31`

Authorization: `Viewer, Analyst, or Admin`

Purpose:

- Provides a high-level business snapshot for general users.
- Suitable for quick dashboard cards and overview charts.

Query parameters:

- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`

Response includes:

- `summary`: totals such as income, expenses, net balance
- `categoryTotals`: grouped totals by category
- `recentActivity`: latest record activity list
- `monthlyTrend`: month-wise income/expense trend

Example response:

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

Possible errors:

- `400` invalid query parameters
- `401` missing/invalid authentication
- `403` insufficient permissions

### Dashboard Insights

`GET /api/dashboard/insights?startDate=2026-01-01&endDate=2026-12-31&interval=month`

Authorization: `Analyst or Admin`

Purpose:

- Provides deeper analytical metrics for decision-making.
- Suitable for analyst/admin reporting and performance analysis.

Query parameters:

- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`
- `interval` (optional): `week` or `month` (default: `week`)

Response includes:

- `filters`: effective filters used by the API
- `metrics`: aggregate KPIs (totals, averages, savings rate, ratios)
- `trend`: interval-based trend with income/expense/net values
- `topExpenseCategories`: top spending categories
- `topIncomeCategories`: top income categories

Example response:

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
- `401` missing/invalid authentication
- `403` insufficient permissions

Difference between Summary and Insights:

- **Dashboard Summary** is a quick overview endpoint for all roles (`viewer`, `analyst`, `admin`).
- **Dashboard Insights** is a detailed analytics endpoint for advanced users (`analyst`, `admin`) with extra KPIs and interval-based analysis.

## Common Error Format

```json
{
  "message": "Invalid request body",
  "details": [
    { "field": "username", "message": "Username is required and must be valid" }
  ]
}
```

## Error Response Types

### 400 / 401 / 403 / 404 / 409 / 429 / 500

Standard format:

```json
{
  "message": "Error message"
}
```

Validation format (when field-level validation fails):

```json
{
  "message": "Invalid request body",
  "details": [
    { "field": "fieldName", "message": "Validation message" }
  ]
}
```
