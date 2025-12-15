# Monitoring

Production observability with Prometheus metrics, structured logging, and health checks.

## What You'll Learn

- Available Prometheus metrics
- Adding custom metrics
- Setting up Prometheus and Grafana
- Structured JSON logging
- Health check endpoints
- Alerting recommendations

## Metrics Endpoint

Prometheus-formatted metrics are exposed at:

```
GET /metrics
```

## Available Metrics

### HTTP Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency by path, method, status |
| `http_requests_total` | Counter | Total requests by path, method, status |
| `http_active_connections` | Gauge | Currently active connections |

### Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `user_registrations_total` | Counter | Total user signups |
| `user_logins_total` | Counter | Total login attempts |
| `jobs_processed_total` | Counter | Background jobs processed |
| `jobs_failed_total` | Counter | Background jobs failed |
| `cache_hits_total` | Counter | Cache hits |
| `cache_misses_total` | Counter | Cache misses |

### System Metrics

Default Node.js metrics from `prom-client`:

- `process_cpu_seconds_total` - CPU usage
- `nodejs_heap_size_total_bytes` - Heap memory
- `nodejs_heap_size_used_bytes` - Used heap memory
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `nodejs_gc_duration_seconds` - Garbage collection

## Adding Custom Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from '../lib/metrics';

// Counter - tracks cumulative values
const orderCounter = new Counter({
  name: 'orders_total',
  help: 'Total orders placed',
  labelNames: ['status'],
  registers: [register],
});

// Increment
orderCounter.inc({ status: 'completed' });
orderCounter.inc({ status: 'failed' });

// Histogram - tracks distributions
const paymentDuration = new Histogram({
  name: 'payment_processing_seconds',
  help: 'Payment processing duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Observe
const end = paymentDuration.startTimer();
await processPayment();
end();

// Gauge - tracks current values
const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Currently active users',
  registers: [register],
});

// Set, inc, dec
activeUsers.set(100);
activeUsers.inc();
activeUsers.dec();
```

## Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'express-api'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    
  - job_name: 'express-worker'
    static_configs:
      - targets: ['worker:3001']
    metrics_path: '/metrics'
```

### Docker Compose Integration

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    profiles:
      - monitoring

volumes:
  grafana_data:
```

```bash
docker-compose --profile monitoring up -d
```

## Grafana Dashboard

### Useful PromQL Queries

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# Request rate by endpoint
sum by (path) (rate(http_requests_total[5m]))

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate (5xx responses)
sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100

# Success rate
sum(rate(http_requests_total{status_code=~"2.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100

# Active connections
http_active_connections

# Cache hit rate
sum(rate(cache_hits_total[5m])) /
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100

# Job processing rate
rate(jobs_processed_total[5m])

# Memory usage
process_resident_memory_bytes / 1024 / 1024
```

### Dashboard Panels

Recommended dashboard layout:

1. **Overview Row**
   - Request rate
   - Error rate
   - Average latency
   - Active connections

2. **Latency Row**
   - P50, P95, P99 latencies
   - Latency by endpoint

3. **Errors Row**
   - Error rate over time
   - Errors by status code
   - Errors by endpoint

4. **System Row**
   - CPU usage
   - Memory usage
   - Event loop lag

## Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Basic health | `{"status":"ok"}` |
| `/health/live` | Kubernetes liveness | `{"status":"ok"}` |
| `/health/ready` | Readiness check | `{"status":"ok","database":"connected","redis":"connected"}` |

### Usage

```bash
# Basic health
curl http://localhost:3000/health

# Readiness (checks DB + Redis)
curl http://localhost:3000/health/ready
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
```

## Structured Logging

Winston logger with JSON output:

```typescript
import logger from '../utils/logger';

// Info level
logger.info('User registered', { 
  userId: user.id, 
  email: user.email 
});

// Error level
logger.error('Payment failed', { 
  error: error.message,
  orderId,
  stack: error.stack,
});

// Warning level
logger.warn('Rate limit approaching', {
  userId,
  requestCount: 90,
  limit: 100,
});
```

### Log Output

```json
{
  "level": "info",
  "message": "User registered",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "correlationId": "abc-123",
  "userId": "user_123",
  "email": "user@example.com"
}
```

### Correlation IDs

Request tracing with correlation IDs:

```typescript
// Automatically added by tracing middleware
logger.info('Processing request', { 
  correlationId: req.correlationId 
});
```

## Alerting Recommendations

Set up alerts for:

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Error rate | > 1% for 5 min | Warning |
| Error rate | > 5% for 2 min | Critical |
| P95 latency | > 2s for 5 min | Warning |
| P95 latency | > 5s for 2 min | Critical |
| Memory usage | > 80% | Warning |
| Memory usage | > 95% | Critical |
| Health check failed | 3 consecutive | Critical |

### Alertmanager Example

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High API latency
```
