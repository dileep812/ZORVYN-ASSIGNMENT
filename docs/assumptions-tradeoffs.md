# Assumptions and Tradeoffs

## Assumptions

- Single shared dashboard
- JWT access token only
- Seed users are for local/demo use
- Admin creates initial accounts and resets passwords when needed

## Tradeoffs

- Optimistic locking is simpler than pessimistic locking, but clients must retry on `409`
- Soft delete preserves history, but reads must filter deleted rows
- Manual validation is explicit, but it is more verbose than a schema library
- Password reset and self-service change are separated for clarity and safety
