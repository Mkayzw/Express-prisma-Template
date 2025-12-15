# Configuration

All configuration is managed through environment variables.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs | Required |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Setup

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your values:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-change-in-production"
```

## Config Module

Configuration is loaded in `src/config/index.ts`:

```typescript
import config from './config';

console.log(config.port);        // 3000
console.log(config.redisUrl);    // redis://localhost:6379
```

## Validation

Required variables are validated at startup. The app will throw an error if `DATABASE_URL` or `JWT_SECRET` are missing.
