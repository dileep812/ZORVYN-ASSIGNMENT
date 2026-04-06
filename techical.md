I chose Node.js with Express for the framework because it gives a fast setup, simple routing, and a clean middleware model for authentication, validation, and error handling. For this assignment scope, Express was a good balance of speed and control without unnecessary complexity.

I used SQL (PostgreSQL) as the database because the data model is structured and relational (users, roles, and financial records). SQL made it easy to enforce integrity using constraints, foreign keys, and indexes, and it supports filtering, pagination, and aggregation efficiently for dashboard use cases.

For authentication, I used JWT because it fits this API model well: stateless token verification, easy role propagation, and straightforward protection of routes through middleware. Tokens are validated on protected endpoints, and role-based access control is applied per route to separate viewer, analyst, and admin permissions.

Architecture (Detailed)
I followed a layered architecture with clear separation of concerns:

1.Routes layer
Defines endpoints and maps them to controllers.
Also attaches middleware (auth, role checks, request validation).

2.Middleware layer
Handles cross-cutting concerns:

•token verification
•role authorization
•request validation
•centralized error handling
This keeps controller logic focused only on business behavior.

3.Controller layer
Implements use cases (login, profile updates, record operations, dashboard APIs).
Controllers coordinate validation output, service/query calls, and HTTP responses.

4.Data access / query utilities layer
Contains reusable SQL/query helpers and common DB operations.
This reduces duplication and keeps SQL logic consistent across controllers.

5.Database layer (PostgreSQL)
Stores relational entities with constraints, indexes, and soft-delete behavior for records.


-------------------improvements---------------------------
In the next iteration, I would improve the system in four major areas:

1.Multi-admin governance model
The current implementation assumes a single-admin control path. A scalable model should support multiple admins with clear governance rules. For admin-role removal, I would implement a voting workflow where removal requires at least 50% approval from current admins (excluding the target user’s own vote). This adds accountability, but introduces complexity in vote tracking, concurrency, and consistency guarantees.

2.Password ownership and onboarding
Currently, initial users are created by admin with predefined credentials. I would move to a secure first-time setup flow where users set their own password through a one-time invitation link with expiry. This reduces credential sharing risk and improves account security.

3.Analyst Recommendation System
A future enhancement is to allow analysts to submit recommendations on how to increase income and reduce expenses, and make those recommendations visible to viewers, analysts, and admins so everyone can review improvement ideas in one place

4.Self-registration for viewer/analyst roles
I would add direct registration flows for viewer and analyst users so they can create accounts and set passwords themselves, with proper validation and approval rules. This removes dependency on manual admin-created credentials and improves usability.

5.Email notification and alerting system
I would add notification support for important financial events (specific expense/income conditions and alert thresholds). This would include configurable triggers, templated emails, retry handling, and background job processing to avoid blocking API performance








