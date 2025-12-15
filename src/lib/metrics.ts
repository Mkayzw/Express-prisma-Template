import { Request, Response, NextFunction } from 'express';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

// Active connections gauge
export const activeConnections = new Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [register],
});

// Custom business metrics
export const userRegistrations = new Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    registers: [register],
});

export const jobsProcessed = new Counter({
    name: 'jobs_processed_total',
    help: 'Total number of background jobs processed',
    labelNames: ['queue', 'status'],
    registers: [register],
});

export const cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    registers: [register],
});

export const cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    registers: [register],
});

// Get normalized route path (replace IDs with :id)
const normalizePath = (path: string): string => {
    return path
        .replace(/\/[a-f0-9-]{24,}/g, '/:id')  // MongoDB ObjectIds
        .replace(/\/[a-z0-9]{20,}/g, '/:id')    // CUIDs
        .replace(/\/\d+/g, '/:id');              // Numeric IDs
};

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime();
    activeConnections.inc();

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds + nanoseconds / 1e9;

        const route = normalizePath(req.route?.path || req.path);
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
        };

        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);
        activeConnections.dec();
    });

    next();
};

// Metrics endpoint handler
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        res.status(500).end('Error collecting metrics');
    }
};

export { register };
