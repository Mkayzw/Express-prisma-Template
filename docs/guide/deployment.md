# Deployment

Deploy your API to production with Docker, NGINX, and process management.

## What You'll Learn

- Production deployment options
- Docker Compose production setup
- NGINX reverse proxy configuration
- Process management with PM2
- Production security checklist

## Production Checklist

Before deploying, ensure:

- [ ] `NODE_ENV=production` is set
- [ ] Strong `JWT_SECRET` (64+ characters)
- [ ] Database connection is secure (SSL)
- [ ] CORS origins are restricted
- [ ] Rate limiting is configured
- [ ] Migrations are deployed
- [ ] Health checks are working

## Docker Deployment

### Build and Run

```bash
# Build the production image
docker build -t express-prisma-api .

# Run with Docker Compose
docker-compose up -d
```

### Docker Compose Stack

The included `docker-compose.yml` provides:

| Service | Description | Port |
|---------|-------------|------|
| `app` | API server | 3000 |
| `worker` | Background job processor | - |
| `db` | PostgreSQL database | 5432 |
| `redis` | Redis cache & queue | 6379 |
| `nginx` | Reverse proxy | 80/443 |

```bash
# Development with hot reload
docker-compose --profile dev up

# Production
docker-compose up -d

# Production with NGINX
docker-compose --profile production up -d

# View logs
docker-compose logs -f app worker
```

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/production
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  worker:
    build: .
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    profiles:
      - production

volumes:
  postgres_data:
  redis_data:
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

### Basic Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Upstream API servers
    upstream api {
        server app:3000;
        keepalive 32;
    }

    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name api.example.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.example.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Gzip compression
        gzip on;
        gzip_types application/json;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy to API
        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check (no rate limit)
        location /health {
            limit_req off;
            proxy_pass http://api;
        }
    }
}
```

### SSL with Let's Encrypt

```bash
# Install certbot
apt install certbot

# Get certificate
certbot certonly --webroot -w /var/www/html -d api.example.com

# Auto-renew
certbot renew --dry-run
```

## Process Management

### PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start API
pm2 start dist/server.js --name api -i max

# Start worker
pm2 start dist/worker.js --name worker

# Save process list
pm2 save

# Auto-start on reboot
pm2 startup

# Monitor
pm2 monit
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker',
      script: 'dist/worker.js',
      instances: 2,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js --env production
```

## Production Environment

```env
NODE_ENV=production

# Database (use connection pooling)
DATABASE_URL="postgresql://user:pass@db-host:5432/prod_db?connection_limit=10"

# Redis
REDIS_URL="redis://redis-host:6379"

# Security
JWT_SECRET="your-64-char-minimum-production-secret"
CORS_ORIGIN="https://your-frontend.com"

# Rate limiting (adjust based on traffic)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

::: warning Security
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Enable database SSL
- Use private networking between services
:::

## Health Checks

Configure your load balancer or orchestrator:

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Basic health | `200 OK` |
| `/health/live` | Liveness probe | `200 OK` |
| `/health/ready` | Readiness (DB + Redis) | `200 OK` with status |

```bash
# Kubernetes probes example
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

### Load Balancing

```nginx
upstream api {
    least_conn;  # Or ip_hash for sticky sessions
    server app1:3000;
    server app2:3000;
    server app3:3000;
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection errors | Check `DATABASE_URL`, SSL settings |
| Redis connection errors | Verify Redis is running, check URL |
| High memory usage | Tune Node.js heap: `--max-old-space-size=4096` |
| Slow responses | Check database queries, add indexes |
| 502 Bad Gateway | App not running, check logs |
