# Data Model

## users

Columns:

- id
- name
- email
- username
- password_hash
- role
- is_active
- created_at
- updated_at

## financial_records

Columns:

- id
- amount
- type
- category
- record_date
- notes
- created_by
- version
- is_deleted
- created_at
- updated_at

## Indexes

- unique username for login lookup
- role + active status
- record date
- record type
- record category
- soft delete flag
- created_by for user-based joins

## Seeded users

- admin1
- admin2
- analyst1
- analyst2
- viewer1

Default password:

- ChangeMe123!
