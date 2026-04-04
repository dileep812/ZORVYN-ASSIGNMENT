# Architecture

## Folder Purpose

- `src/server.js`: app bootstrap, middleware registration, route mounting
- `src/config.js`: environment loading and required config checks
- `src/routes/`: request paths and access control wiring
- `src/controllers/`: business logic and DB interaction orchestration
- `src/middleware/`: auth, RBAC, validation, error handling
- `src/security/`: bcrypt/JWT utilities
- `src/db/`: connection pool, schema, initialization script
- `src/validation/`: manual request validation functions
