# Quick Start

Get up and running in under 5 minutes.

## What You'll Learn

- How to install and configure the boilerplate
- Setting up your database and Redis
- Running the API server and worker
- Verifying everything works correctly

## Prerequisites

Ensure you have installed:

- [Node.js](https://nodejs.org/) 18+ 
- [PostgreSQL](https://www.postgresql.org/) 14+
- [Redis](https://redis.io/) 7+
- [pnpm](https://pnpm.io/) (recommended) or npm

## 1. Get the Template

```bash
# Clone the repository
git clone https://github.com/Mkayzw/Express-prisma-Template.git my-api
cd my-api

# Install dependencies
pnpm install
```

## 2. Environment Setup

Create your environment configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/express_prisma_db"

# Redis (Required)
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

::: warning Security Note
Generate a secure JWT secret for production:
```bash
openssl rand -hex 64
```
Never commit your `.env` file to version control!
:::

## 3. Database Setup

```bash
# Generate Prisma client
pnpm run generate

# Run migrations
pnpm run migrate

# Seed database (optional)
pnpm run seed
```

Expected output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "express_prisma_db"

Applying migration `20231201000000_init`

Database is now in sync with your schema.
✔ Generated Prisma Client
```

## 4. Start the Application

```bash
# Terminal 1: Start API server
pnpm run dev

# Terminal 2: Start worker (for background jobs)
pnpm run dev:worker
```

You should see:
```
[server] 🚀 Server running at http://localhost:3000
[server] 📊 Metrics available at http://localhost:3000/metrics
[server] 🏥 Health check at http://localhost:3000/health
```

## 5. Verify Installation

Test your API is working:

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Readiness Check
```bash
curl http://localhost:3000/health/ready
```

Response:
```json
{"status":"ok","database":"connected","redis":"connected"}
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "test@example.com", "role": "USER" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## You're Ready! 🎉

Congratulations! You now have a fully functional API with:

- ✅ REST API with Express 5
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT authentication with refresh tokens
- ✅ Redis caching and sessions
- ✅ BullMQ background job processing
- ✅ Prometheus metrics at `/metrics`
- ✅ Rate limiting enabled

## Docker Quick Start

Prefer Docker? Start everything with one command:

```bash
# Development with hot reload
docker-compose --profile dev up

# Production
docker-compose up -d
```

This starts PostgreSQL, Redis, and the API automatically.

---

## Next Steps

### Essential Reading
- [Project Structure](/guide/project-structure) - Learn how the code is organized
- [Configuration](/guide/configuration) - Understand all configuration options
- [Authentication](/guide/authentication) - Set up user management

### Popular Features
- [Database Operations](/guide/database) - Working with models and CRUD
- [Caching](/guide/caching) - Speed up your API with Redis caching
- [Background Jobs](/guide/jobs) - Process tasks asynchronously

### Production
- [Deployment](/guide/deployment) - Deploy to production
- [Monitoring](/guide/monitoring) - Set up observability
