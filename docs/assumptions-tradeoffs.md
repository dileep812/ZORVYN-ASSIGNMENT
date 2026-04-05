# Assumptions & Tradeoffs

This document explains the key design decisions, assumptions, and tradeoffs made during development.

## Core Assumptions

### 1. Single Shared Dashboard

**Assumption:** All users access the same financial dashboard with role-based filtering.

**Rationale:** The application serves a team sharing one set of financial records, not isolated per-user instances.

**Impact:** No user-scoped record filtering. Analysts and admins see all records; viewers see summary only.

### 2. JWT Access Token Only (No Refresh Tokens)

**Assumption:** Access tokens expire in 1 hour and users re-login for new tokens.

**Rationale:** Simplifies state management and eliminates refresh token storage.

**Tradeoff:** Users can't stay logged in for more than 1 hour without re-authenticating.

**Mitigation:** HTTP-only cookies auto-send tokens on browser requests; mobile apps handle re-login.

### 3. Seed Users for Local/Demo Use Only

**Assumption:** Default users (admin1, analyst1, etc.) with password `ChangeMe123!` are pre-created for development.

**Rationale:** Eliminates manual account creation during setup.

**Impact:** Must be disabled or changed in production. Never commit real production data.

**Security:** Reset of seed users recommended before production deployment.

### 4. Admin Creates Initial Accounts

**Assumption:** Only admins can create new users and set initial passwords.

**Rationale:** Maintains strict access control over user provisioning.

**Impact:** Self-service signup is not supported; board new team members requires admin action.

**Benefit:** Single point of access control for user registration.

### 5. Last-Write-Wins Record Updates

**Assumption:** When two clients update the same record simultaneously, the last write succeeds without conflict detection.

**Rationale:** Optimistic locking (version fields) removed for simplicity.

**Tradeoff:** Concurrent edits to the same record can overwrite each other's changes.

**Rationale for Removal:** Most financial data has infrequent concurrent edits; strict consistency less critical than simplicity.

**When to Revisit:** If concurrent record editing becomes common, add pessimistic locking or version fields.

### 6. Soft Delete for Records (Never Hard Delete)

**Assumption:** Records marked `is_deleted=true` are retained in the database.

**Rationale:** Preserves audit trail and historical data; enables accidental deletion recovery.

**Impact:** All read queries must filter `WHERE is_deleted = false`.

**Storage Tradeoff:** Uses more disk space over time; requires periodic archival in long-running systems.

## Technical Tradeoffs

### Manual Validation vs. Schema Library

**Choice:** Manual request validation (hand-written in `validate.middleware.js` and utilities)

**Rationale:**
- Explicit control over error messages
- Minimal runtime dependencies
- Clear code flow (no black-box magic)

**Tradeoff:**
- More verbose than libraries like `joi` or `zod`
- No automatic TypeScript inference (not TypeScript-based)
- Must manually maintain validation rules

**Consideration:** For larger projects, a schema library may improve maintainability.

### Direct SQL Queries vs. ORM

**Choice:** Direct parameterized queries (no ORM like Sequelize or Prisma)

**Rationale:**
- Full control over query optimization
- Minimal abstraction overhead
- Easier debugging and auditing

**Tradeoff:**
- More SQL knowledge required
- No automatic migrations (manual schema updates)
- SQL string management (DRY principles apply)

**Benefit:** Query patterns are reusable and centralized in utility modules.

### HTTP-Only Cookies vs. Bearer Only

**Choice:** Support both HTTP-only cookies and Bearer token headers.

**Rationale:**
- Cookies secure browser clients (CSRF-protected)
- Bearer tokens enable mobile and API clients
- Maximum flexibility

**Tradeoff:** Dual authentication adds configuration complexity.

### Single Admin vs. Role-Based Admins

**Choice:** All admins have identical permissions (no admin levels/scopes).

**Rationale:** Simplifies permission logic; avoids hierarchical complexity.

**Tradeoff:** Cannot delegate specific admin duties (e.g., one admin for users, another for reports).

**When to Revisit:** If granular admin permissions become needed.

### Pagination (Not Cursor-Based)

**Choice:** Offset-based pagination (`page` and `limit` parameters).

**Rationale:** Simpler to implement and understand; sufficient for small-medium datasets.

**Tradeoff:** Less efficient for very large datasets or when data changes frequently during pagination.

**Alternative:** Cursor-based pagination is more efficient for APIs with large result sets.

## Security Tradeoffs

### JWT in URL vs. Header vs. Cookie

**Choice:** JWT in HTTP-only cookie (automatic) + Bearer header (optional).

**Rationale:**
- Cookies prevent CSRF via SameSite policy
- Header Bearer enables API consumption
- No cookie leakage via logs/history

**Tradeoff:** Browser clients must enable cookies; CORS configuration required.

### Password Hashing: bcrypt vs. Argon2

**Choice:** bcryptjs (bcrypt implementation in JavaScript).

**Rationale:** Industry standard; sufficient security for most use cases; no compiled dependencies.

**Tradeoff:** Slightly slower hashing (~100ms) than Argon2; acceptable for login endpoints.

## Data Model Tradeoffs

### Denormalized vs. Normalized

**Choice:** Normalized schema (no data duplication).

**Rationale:** Maintains consistency; easier updates.

**Tradeoff:** Requires JOINs for some queries (slight performance cost).

### Soft Delete vs. Hard Delete

**Already covered above** — soft delete chosen for audit trail.

### Record Timestamps (created_at, updated_at)

**Choice:** Track both creation and last update.

**Rationale:** Enables sorting, auditing, and trend analysis.

**Impact:** Slight storage overhead; enables time-based reporting.

## Operational Tradeoffs

### Connection Pooling

**Choice:** Keep 10-20 concurrent connections to PostgreSQL.

**Rationale:** Balances concurrency capacity with resource usage.

**Tradeoff:** May limit throughput under extreme load (millions of requests/minute).

**For High Load:** Increase pool size or use connection multiplexing (PgBouncer).

### Error Logging

**Choice:** Centralized error middleware logs to console.

**Rationale:** Simple to debug; integrates with log aggregation tools.

**Tradeoff:** Logs not rotated; no persistent error database.

**Production Practice:** Integrate with Sentry, Datadog, or similar for persistent error tracking.

## API Design Tradeoffs

### RESTful Endpoints vs. GraphQL

**Choice:** RESTful HTTP endpoints.

**Rationale:** Simpler to implement; standard query parameters for filtering.

**Tradeoff:** Multiple endpoints for related data (less flexible than GraphQL); some over/under-fetching.

### Flat vs. Nested Resources

**Choice:** Mostly flat resources (e.g., `/api/records`, not `/api/users/:id/records`).

**Rationale:** Simpler routing; easier filtering and independent resource management.

**Tradeoff:** Less hierarchical URL structure.

### Request/Response Format

**Choice:** Wrapped responses with `{ data: ..., meta: ... }` structure.

**Rationale:** Consistent error/success format; space for metadata.

**Tradeoff:** Extra nesting compared to direct resource responses.

## Summary Table

| Area | Choice | Benefit | Tradeoff |
|------|--------|---------|----------|
| Auth | JWT + Cookies | Security + Flexibility | CORS complexity |
| Data Loss | Soft delete | Audit trail | Extra storage |
| Validation | Manual | Control + Clarity | Verbose code |
| Database | Direct SQL | Performance | Requires SQL knowledge |
| Pagination | Offset-based | Simple | Less efficient at scale |
| Hashing | bcrypt | Standard | ~100ms/hash |
| Admin | Single tier | Simple | No role delegation |
| API | REST | Standard | Less flexible than GraphQL |

## Revisit Decisions

**The following decisions should be revisited if:**

1. **Concurrent record updates become common** → Implement pessimistic locking or version fields
2. **API clients exceed 100s of requests/sec** → Switch to cursor pagination; optimize queries
3. **Admin role hierarchy needed** → Add permission scopes (user_create, record_delete, etc.)
4. **Validation complexity grows** → Adopt schema library (joi, zod, or TypeScript)
5. **Error tracking at scale** → Integrate centralized error monitoring (Sentry, Datadog)
6. **Database size grows beyond 100GB** → Archive soft-deleted data; consider partitioning

## Conclusion

All tradeoffs prioritize:
1. **Simplicity** — Easy to understand and maintain
2. **Security** — Proper authentication, hashing, SQL injection prevention
3. **Flexibility** — Support multiple client types (browser, mobile, API)

The current design is suitable for small-to-medium teams (< 1000 users). As the system scales, revisit these decisions and migrate if needed.
