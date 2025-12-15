# Configuration

Environment-based configuration for all application settings.

## What You'll Learn

- All available environment variables
- How configuration is loaded and validated
- Environment-specific settings
- Security best practices

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | **Yes** |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | No |
| `JWT_SECRET` | Secret for signing JWTs | - | **Yes** |
| `JWT_EXPIRES_IN` | Legacy token expiry | `7d` | No |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` | No |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

## Complete .env Example

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/express_prisma_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Authentication (Required - change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Setup

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit with your values:
```bash
# Generate a secure JWT secret
openssl rand -hex 64
```

## Config Module

Configuration is centralized in `src/config/index.ts`:

```typescript
import config from './config';

// Access configuration
console.log(config.port);           // 3000
console.log(config.nodeEnv);        // 'development'
console.log(config.databaseUrl);    // PostgreSQL URL
console.log(config.redisUrl);       // Redis URL
console.log(config.jwtSecret);      // JWT signing secret
```

### Type-Safe Access

The config object is fully typed:

```typescript
interface Config {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}
```

## Validation

Required variables are validated at startup. The app throws an error if `DATABASE_URL` or `JWT_SECRET` are missing:

```
Error: Missing required environment variable: JWT_SECRET
```

## Environment-Specific Settings

### Development
```env
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

### Production
```env
NODE_ENV=production
JWT_SECRET="your-very-long-random-production-secret"
CORS_ORIGIN="https://your-app.com"
DATABASE_URL="postgresql://user:pass@prod-db:5432/prod_db"
REDIS_URL="redis://prod-redis:6379"
```

::: warning Production Security
- Use strong, unique secrets (64+ characters)
- Never commit `.env` to version control
- Use environment variable management (Docker secrets, Kubernetes secrets, etc.)
- Enable HTTPS and update CORS accordingly
:::

## Docker Configuration

When using Docker Compose, environment variables can be set in `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}  # From host .env
```

Or use an env file:

```yaml
services:
  app:
    env_file:
      - .env.production
```
