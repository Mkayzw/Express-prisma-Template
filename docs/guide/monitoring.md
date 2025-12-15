# Monitoring

Production monitoring with Prometheus metrics.

## Metrics Endpoint

```
GET /metrics
```

Returns Prometheus-formatted metrics.

## Available Metrics

### HTTP Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_total` | Counter | Total requests |
| `http_active_connections` | Gauge | Active connections |

### Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `user_registrations_total` | Counter | User signups |
| `jobs_processed_total` | Counter | Background jobs |
| `cache_hits_total` | Counter | Cache hits |
| `cache_misses_total` | Counter | Cache misses |

### System Metrics

Default Node.js metrics are included:
- `process_cpu_seconds_total`
- `nodejs_heap_size_total_bytes`
- `nodejs_eventloop_lag_seconds`

## Adding Custom Metrics

```typescript
import { Counter, Histogram } from 'prom-client';
import { register } from './lib/metrics';

const myCounter = new Counter({
  name: 'my_custom_counter',
  help: 'Description here',
  registers: [register],
});

// Increment
myCounter.inc();
```

## Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'express-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
```

## Grafana Dashboard

Import a dashboard with these queries:

```promql
# Request rate
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
```

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health |
| `/health/live` | Kubernetes liveness |
| `/health/ready` | Readiness (DB + Redis) |

## Logging

Structured JSON logs via Winston:

```typescript
import logger from './utils/logger';

logger.info('User registered', { userId: user.id });
logger.error('Payment failed', { error, orderId });
```

Logs include correlation IDs for request tracing.
