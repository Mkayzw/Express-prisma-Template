# Deployment

Deploy your API to production.

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t express-prisma-api .

# Run with Docker Compose
docker-compose up -d
```

### Docker Compose Stack

The included `docker-compose.yml` provides:

- **app** - API server
- **db** - PostgreSQL database
- **redis** - Redis cache
- **nginx** - Reverse proxy (optional)

```bash
# Production
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up
```

## Manual Deployment

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build TypeScript
pnpm run build

# Run migrations
pnpm run migrate:deploy

# Start server
NODE_ENV=production pnpm run start

# Start worker (separate process)
NODE_ENV=production pnpm run start:worker
```

## NGINX Reverse Proxy

The `nginx/nginx.conf` provides:

- Rate limiting
- Gzip compression
- Load balancing
- SSL termination (template included)

Start with nginx profile:
```bash
docker-compose --profile production up -d
```

## Environment Variables

Set these in production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/prod_db
REDIS_URL=redis://redis-host:6379
JWT_SECRET=your-very-long-random-secret
CORS_ORIGIN=https://your-frontend.com
```

## Process Management

Use PM2 for production:

```bash
npm install -g pm2

# Start API
pm2 start dist/server.js --name api

# Start worker
pm2 start dist/worker.js --name worker

# Save and auto-start on reboot
pm2 save
pm2 startup
```

## Health Checks

Configure your load balancer to check:

- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe (checks DB + Redis)
