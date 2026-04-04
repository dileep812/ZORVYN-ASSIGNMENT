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

## Password Change

Endpoint:

`PATCH /api/me/password`

Request body:

```json
{
  "currentPassword": "ChangeMe123!",
  "newPassword": "MyNewStrongPass123!",
  "confirmPassword": "MyNewStrongPass123!"
}
```
