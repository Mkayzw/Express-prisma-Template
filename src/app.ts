import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import userRoutes from './modules/user/user.routes';
import authRoutes from './modules/auth/auth.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import errorHandler from './middleware/errorHandler';
import { tracingMiddleware } from './middleware/tracing.middleware';
import { metricsMiddleware, metricsHandler } from './lib/metrics';
import logger from './utils/logger';
import { prisma } from './db/client';
import RedisClient from './lib/redis';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app: ReturnType<typeof express> = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(limiter);
app.use(tracingMiddleware);
app.use(metricsMiddleware);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/jobs', jobsRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Metrics endpoint (Prometheus)
app.get('/metrics', metricsHandler);

// Health check - basic liveness
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Health check - liveness probe for Kubernetes
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
  });
});

// Health check - readiness probe with dependency checks
app.get('/health/ready', async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
  }

  try {
    // Check Redis
    checks.redis = await RedisClient.isHealthy();
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  const isReady = checks.database && checks.redis;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;