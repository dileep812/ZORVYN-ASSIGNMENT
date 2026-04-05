# Assumptions and Tradeoffs

## Assumptions

- Single shared dashboard
- JWT access token only
- Seed users are for local/demo use
- Admin creates initial accounts and resets passwords when needed

## Tradeoffs

- Record updates follow last-write-wins behavior, which simplifies clients but can overwrite near-simultaneous edits
- Soft delete preserves history, but reads must filter deleted rows
- Manual validation is explicit, but it is more verbose than a schema library
- Password reset and self-service change are separated for clarity and safety
