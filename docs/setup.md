# Setup

## Prerequisites

- Node.js 20+
- PostgreSQL

## Installation

1. Install dependencies:

   `npm install`

2. Copy `.env.example` to `.env` and set:

   - `PORT=4000`
   - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/finance_dashboard`
   - `JWT_SECRET=replace-with-a-strong-secret`
   - `JWT_EXPIRES_IN=1h`

3. Initialize the database:

   `npm run db:init`

4. Start the app:

   `npm run dev`

## Production

- `npm start`

## Validation check

- `npm run check`
