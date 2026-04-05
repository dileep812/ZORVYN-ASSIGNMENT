# Authentication

## Login

Endpoint:

`POST /api/auth/login`

Request body:

```json
{
  "username": "admin1",
  "password": "ChangeMe123!"
}
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

## Protected Requests

Send the JWT in the header:

`Authorization: Bearer <token>`

## Cookie Support

The JWT token is automatically set as an HTTP-only cookie on login. For browser-based clients, ensure CORS is configured with `credentials: true`. Token verification happens on every protected request.

## Profile Management

Users can update their profile including password through: `PATCH /api/me/profile`

See the **API Reference** for details on profile update restrictions and password change.
