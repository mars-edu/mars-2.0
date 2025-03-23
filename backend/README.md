# Mars 2.0 Backend - Cloudflare Workers Edition

This is the backend API for Mars 2.0, built with Hono for Cloudflare Workers and using Cloudflare D1 as the database.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` for local development: `cp .env.example .env`

## Environment Configuration

This project uses Cloudflare Workers and environment variables are configured in `wrangler.toml`:

```toml
[vars]
JWT_SECRET = "your-secret-key"
JWT_EXPIRY = "24h"
FRONTEND_URL = "http://localhost:5173"
```

### Required Environment Variables

| Variable     | Description                      | Default               |
| ------------ | -------------------------------- | --------------------- |
| JWT_SECRET   | Secret key for JWT token signing | -                     |
| JWT_EXPIRY   | JWT token expiry time            | 24h                   |
| FRONTEND_URL | Frontend URL for CORS            | http://localhost:5173 |

## Database Setup

This project uses Cloudflare D1 for the database. To set up:

1. Create a D1 database in the Cloudflare Dashboard
2. Update `wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mars-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

3. Initialize the database with seed data:

```bash
npm run seed
```

## Development

To run the development server:

```bash
npm run dev
```

## Deployment

To deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Migration from SQLite

This project was migrated from SQLite to Cloudflare D1. The database schema remains similar, but all database operations now use D1 query methods instead of Prisma.

The main changes include:

- Replaced Prisma client with D1 database service
- Updated database queries to use SQL instead of Prisma client
- Configuration for Cloudflare Workers environment
