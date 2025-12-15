# Quick Start

Get up and running in under 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm (recommended)

## Installation

```bash
# Clone the repository
git clone https://github.com/Mkayzw/Express-prisma-Template.git
cd Express-prisma-Template

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

## Configuration

Edit `.env` with your settings:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key"
```

## Database Setup

```bash
# Generate Prisma client
pnpm run generate

# Run migrations
pnpm run migrate

# Seed database (optional)
pnpm run seed
```

## Start Development

```bash
# Start API server
pnpm run dev

# Start worker (separate terminal)
pnpm run dev:worker
```

The API will be available at `http://localhost:3000`.

## Docker Quick Start

```bash
# Start everything with Docker
docker-compose --profile dev up
```

This starts PostgreSQL, Redis, and the API with hot reloading.

## Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
