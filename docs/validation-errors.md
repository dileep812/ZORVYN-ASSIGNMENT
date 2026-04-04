# Validation and Errors

## Validation behavior

- Bodies and queries are validated manually
- Unknown fields are rejected
- Dates must be valid `YYYY-MM-DD`
- Passwords and usernames have length/format rules
- Update payloads must include at least one valid field

## Error codes

- `400` invalid input
- `401` invalid authentication
- `403` inactive or forbidden access
- `404` not found
- `409` conflict
- `500` unexpected server error

## Security

- SQL uses parameterized queries
- Passwords are hashed with bcrypt
- JWT is used for auth instead of mock headers
