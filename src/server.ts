import app from './app';
import config from './config';
import { prisma } from './db/client';
import RedisClient from './lib/redis';
import logger from './utils/logger';

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to database successfully');

    // Connect to Redis
    await RedisClient.connect();
    logger.info('Connected to Redis successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info('Health check available at /health');
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await prisma.$disconnect();
          logger.info('Database connection closed');

          // Close Redis connection
          await RedisClient.disconnect();
          logger.info('Redis connection closed');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Error starting server:', error);
  process.exit(1);
});