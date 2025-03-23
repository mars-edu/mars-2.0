# Mars 2.0 Backend

## Environment Variables

This project uses Zod to validate environment variables. Copy `.env.example` to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

### Required Environment Variables

| Variable     | Description                               | Default               |
| ------------ | ----------------------------------------- | --------------------- |
| PORT         | Server port                               | 3001                  |
| NODE_ENV     | Environment (development/production/test) | development           |
| DATABASE_URL | Database connection string                | -                     |
| JWT_SECRET   | Secret key for JWT token signing          | -                     |
| JWT_EXPIRY   | JWT token expiry time                     | 24h                   |
| FRONTEND_URL | Frontend URL for CORS                     | http://localhost:5173 |

### Environment Validation

All environment variables are validated using Zod when the application starts. If any required variable is missing or invalid, the application will fail to start with a descriptive error message.

To add new environment variables, update the schema in `src/utils/env.ts`.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
