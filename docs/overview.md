# Overview

This backend powers a shared finance dashboard with PostgreSQL persistence, JWT authentication, role-based access control, manual validation, and concurrency-safe updates.

## Stack

- Node.js (ESM)
- Express
- PostgreSQL
- bcryptjs
- jsonwebtoken

## Roles

- Viewer: dashboard data only
- Analyst: dashboard data plus records read access
- Admin: full management access
